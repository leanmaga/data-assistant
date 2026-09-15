import json
from typing import Dict, List, Any
from .gemini_service import generate_with_gemini
from .schema_parser import get_table_dependencies, topological_sort

async def generate_synthetic_data(
    schema_info: Dict[str, Any],
    prompt_instructions: str,
    num_rows: int,
    temperature: float,
    max_tokens: int
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate synthetic data for all tables in schema
    
    Args:
        schema_info: Parsed schema structure
        prompt_instructions: User's generation instructions
        num_rows: Number of rows to generate per table
        temperature: Generation temperature
        max_tokens: Max tokens per generation
    
    Returns:
        Dictionary mapping table names to generated data
    """
    generated_tables = {}
    
    # Get table generation order (respecting foreign keys)
    dependencies = get_table_dependencies(schema_info)
    table_order = topological_sort(dependencies)
    
    # Generate data for each table in dependency order
    for table_name in table_order:
        if table_name not in schema_info:
            continue
            
        table_info = schema_info[table_name]
        
        # Build schema description
        schema_desc = build_table_description(table_name, table_info)
        
        # Include already generated data for foreign key references
        context = build_generation_context(table_info, generated_tables)
        
        # Create prompt
        prompt = f"""Generate {num_rows} rows of realistic synthetic data for the following database table.

{schema_desc}

{context}

Additional Instructions: {prompt_instructions}

Requirements:
1. Generate data that respects all constraints and data types
2. Ensure foreign keys reference valid values from related tables
3. Make the data realistic and diverse
4. For PRIMARY KEY columns, generate unique values
5. For date/timestamp columns, use ISO format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
6. Return the result as a JSON object with a "data" key containing an array of row objects

Output format:
{{"data": [{{"column1": "value1", "column2": "value2", ...}}, ...]}}

Generate ONLY the JSON output, no additional text."""

        try:
            # Generate with Gemini
            response_text = await generate_with_gemini(
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format="application/json"
            )
            
            # Parse JSON response
            result = json.loads(response_text)
            
            if 'data' in result and isinstance(result['data'], list):
                generated_tables[table_name] = result['data']
                print(f"✅ Generated {len(result['data'])} rows for table '{table_name}'")
            else:
                raise RuntimeError(
                    f"Gemini returned an invalid JSON shape for table '{table_name}'"
                )
                
        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"Gemini returned truncated or invalid JSON for table '{table_name}': {str(e)}"
            ) from e
        except Exception as e:
            raise RuntimeError(f"Error generating data for '{table_name}': {str(e)}") from e
    
    return generated_tables

async def modify_data(
    table_name: str,
    current_data: List[Dict[str, Any]],
    instructions: str,
    temperature: float = 1.0
) -> List[Dict[str, Any]]:
    """
    Modify existing table data based on user instructions
    
    Args:
        table_name: Name of the table
        current_data: Current data to modify
        instructions: User's modification instructions
        temperature: Generation temperature
    
    Returns:
        Modified data
    """
    # Convert current data to JSON string
    current_json = json.dumps(current_data, indent=2)
    
    prompt = f"""You have the following data for table '{table_name}':

{current_json}

User Request: {instructions}

Modify the data according to the user's request and return the complete modified dataset as a JSON object.

Important:
- Return ALL rows, including unmodified ones
- Maintain the same structure and column names
- Ensure data integrity and constraints are respected

Output format:
{{"data": [{{"column1": "value1", "column2": "value2", ...}}, ...]}}

Generate ONLY the JSON output with the modified data, no additional text."""

    try:
        response_text = await generate_with_gemini(
            prompt=prompt,
            temperature=temperature,
            max_tokens=8000,
            response_format="application/json"
        )
        
        result = json.loads(response_text)
        
        if 'data' in result and isinstance(result['data'], list):
            print(f"✅ Modified {len(result['data'])} rows for table '{table_name}'")
            return result['data']
        else:
            print(f"⚠️ Invalid response format, returning original data")
            return current_data
            
    except Exception as e:
        print(f"❌ Error modifying data: {str(e)}")
        return current_data

def build_table_description(table_name: str, table_info: Dict[str, Any]) -> str:
    """Build a human-readable description of the table schema"""
    desc = f"Table: {table_name}\nColumns:\n"
    
    for col in table_info['columns']:
        desc += f"  - {col['name']} ({col['type']})"
        if col['constraints']:
            desc += f" {col['constraints']}"
        desc += "\n"
    
    if table_info['primary_keys']:
        desc += f"\nPrimary Keys: {', '.join(table_info['primary_keys'])}"
    
    if table_info['foreign_keys']:
        desc += "\nForeign Keys:\n"
        for fk in table_info['foreign_keys']:
            desc += f"  - {fk['column']} → {fk['ref_table']}.{fk['ref_column']}\n"
    
    return desc

def build_generation_context(
    table_info: Dict[str, Any],
    generated_tables: Dict[str, List[Dict[str, Any]]]
) -> str:
    """Build context about already generated tables for foreign key references"""
    if not table_info['foreign_keys']:
        return ""
    
    context = "\nReference Data for Foreign Keys:\n"
    
    for fk in table_info['foreign_keys']:
        ref_table = fk['ref_table']
        ref_column = fk['ref_column']
        
        if ref_table in generated_tables:
            ref_data = generated_tables[ref_table]
            # Get unique values from reference column
            ref_values = list(set(row.get(ref_column) for row in ref_data if ref_column in row))
            
            # Limit to first 20 values for brevity
            if len(ref_values) > 20:
                ref_values = ref_values[:20]
                context += f"- {ref_table}.{ref_column}: {ref_values} (showing first 20 values)\n"
            else:
                context += f"- {ref_table}.{ref_column}: {ref_values}\n"
    
    return context