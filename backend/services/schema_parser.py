import re
from typing import Dict, List, Any

def parse_ddl_schema(ddl_text: str) -> Dict[str, Any]:
    """
    Parse DDL schema and extract table information
    
    Args:
        ddl_text: SQL DDL text
    
    Returns:
        Dictionary with table structures
    """
    tables = {}
    
    # Split by CREATE TABLE statements
    table_pattern = r'CREATE TABLE\s+(\w+)\s*\((.*?)\);'
    matches = re.finditer(table_pattern, ddl_text, re.IGNORECASE | re.DOTALL)
    
    for match in matches:
        table_name = match.group(1)
        columns_text = match.group(2)
        
        tables[table_name] = {
            'columns': [],
            'primary_keys': [],
            'foreign_keys': []
        }
        
        # Parse columns
        column_lines = [line.strip() for line in columns_text.split(',')]
        
        for line in column_lines:
            if not line:
                continue
                
            # Check for PRIMARY KEY constraint
            if line.upper().startswith('PRIMARY KEY'):
                pk_match = re.search(r'PRIMARY KEY\s*\((.*?)\)', line, re.IGNORECASE)
                if pk_match:
                    pks = [pk.strip() for pk in pk_match.group(1).split(',')]
                    tables[table_name]['primary_keys'].extend(pks)
            
            # Check for FOREIGN KEY constraint
            elif line.upper().startswith('FOREIGN KEY'):
                fk_match = re.search(
                    r'FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s+(\w+)\s*\((.*?)\)',
                    line,
                    re.IGNORECASE
                )
                if fk_match:
                    tables[table_name]['foreign_keys'].append({
                        'column': fk_match.group(1).strip(),
                        'ref_table': fk_match.group(2).strip(),
                        'ref_column': fk_match.group(3).strip()
                    })
            
            # Parse column definition
            else:
                col_match = re.match(r'(\w+)\s+([\w\(\)]+)(.*)', line, re.IGNORECASE)
                if col_match:
                    col_name = col_match.group(1)
                    col_type = col_match.group(2)
                    constraints = col_match.group(3).strip()
                    
                    # Check for inline PRIMARY KEY
                    if 'PRIMARY KEY' in constraints.upper():
                        tables[table_name]['primary_keys'].append(col_name)
                    
                    tables[table_name]['columns'].append({
                        'name': col_name,
                        'type': col_type,
                        'constraints': constraints
                    })
    
    return tables

def get_table_dependencies(schema: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    Analyze foreign key relationships to determine table generation order
    
    Args:
        schema: Parsed schema dictionary
    
    Returns:
        Dictionary mapping table names to their dependencies
    """
    dependencies = {}
    
    for table_name, table_info in schema.items():
        deps = []
        for fk in table_info.get('foreign_keys', []):
            ref_table = fk['ref_table']
            if ref_table != table_name:  # Avoid self-references
                deps.append(ref_table)
        dependencies[table_name] = deps
    
    return dependencies

def topological_sort(dependencies: Dict[str, List[str]]) -> List[str]:
    """
    Sort tables in order of dependencies (tables with no dependencies first)
    
    Args:
        dependencies: Table dependency mapping
    
    Returns:
        Ordered list of table names
    """
    visited = set()
    result = []
    
    def visit(table: str):
        if table in visited:
            return
        visited.add(table)
        
        for dep in dependencies.get(table, []):
            if dep in dependencies:  # Only visit if table exists in schema
                visit(dep)
        
        result.append(table)
    
    for table in dependencies:
        visit(table)
    
    return result