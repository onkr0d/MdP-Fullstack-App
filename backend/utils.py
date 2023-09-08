from typing import List, Dict, Any

import pandas as pd
import pyodbc
from openpyxl import load_workbook
from pandas import DataFrame
from pyodbc import Connection


def extract_data(file) -> (DataFrame, DataFrame, List[int]):
    """
    Read from an Excel sheet and convert it to a list of dictionaries.
    """

    # Load the workbook
    workbook = load_workbook(file)

    # Assume that the first sheet will contain the data and the first row of data in the table are the column names
    worksheet = workbook.worksheets[0]

    # Get the values from the worksheet
    data = worksheet.values

    # Get the field names from the first row of the data
    fieldnames = next(data)[0:]

    # Create a DataFrame from the data with the field names as column names
    df = pd.DataFrame(data, columns=fieldnames)

    # Assume that the second sheet will be the data dictionary.
    dd_worksheet = workbook.worksheets[1]

    # Get the values from the data dictionary worksheet
    dd_data = dd_worksheet.values

    # Get the field names from the first row of the data dictionary
    dd_fieldnames = next(dd_data)[0:]

    # Create a DataFrame from the data dictionary with the field names as column names
    df_dd = pd.DataFrame(dd_data, columns=dd_fieldnames)

    df_cleaned, rows_not_working = data_validation(df, df_dd)

    # Close the workbook
    workbook.close()

    if df_cleaned.empty:
        print("Dataframe is empty")

    # Return the DataFrame, the data dictionary DataFrame, and the rows_not_working dictionary
    return df_cleaned, df_dd, rows_not_working


def data_validation(data_frame: DataFrame, df_data_dictionary: DataFrame) -> (DataFrame, List[int]):
    # Initialize a dictionary to store rows that didn't match the specified data type
    rows_not_working = []

    # Get the field names and data types from the data dictionary
    field_names = df_data_dictionary.columns.values[0]
    data_type = df_data_dictionary.columns.values[1]
    field_names = df_data_dictionary[field_names].tolist()
    data_types = df_data_dictionary[data_type].tolist()

    # Create a dictionary to store column names and their corresponding data types
    column_types = {}
    for field_name, data_type in zip(field_names, data_types):
        column_types[field_name] = data_type

    # Iterate through the column types dictionary
    for column_name, column_type in column_types.items():
        # Make sure the type we're converting to exists in the data frame
        if column_name not in data_frame.columns:
            continue
        for index, value in enumerate(data_frame[column_name]):
            try:
                # Convert the value to the specified data type
                if column_type in ['str', 'string']:
                    data_frame.at[index, column_name] = str(value)
                elif column_type in ['int', 'integer']:
                    data_frame.at[index, column_name] = int(value)
                elif column_type.lower() in ['date/time', 'datetime', 'datetime64', 'pd.timestamp', 'created']:
                    data_frame.at[index, column_name] = str(pd.to_datetime(value))
            except ValueError:
                # If there is a ValueError, the value doesn't match the specified data type
                # Add the row to the rows_not_working list
                rows_not_working.append(index + 2)

    # Drop the row from the DataFrame            
    for row in rows_not_working:
        data_frame.drop(row - 2, inplace=True)

    return data_frame, rows_not_working


def get_table_schema(conn: Connection) -> (Dict[str, Any], List[str]):
    """
    Get the schema of the database.
    :param conn: Connection object
    :return: schema, column_names
    """
    cursor = conn.cursor()
    schema = {}

    tables = cursor.execute('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES').fetchall()
    tables = [item[0] for item in tables]

    for table in tables:
        columns = cursor.execute(f""" 
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE
            TABLE_NAME = '{table}'""").fetchall()
        schema[table] = columns

    column_names = [item[0] for item in cursor.description]
    n_attr = len(column_names)

    for table in schema:
        n_fields = len(schema[table])
        # get table primary key
        primary_key = cursor.execute(f"""
            SELECT Col.Column_Name from 
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
            INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
            WHERE 
            Col.Constraint_Name = Tab.Constraint_Name
            AND Col.Table_Name = Tab.Table_Name
            AND Tab.Constraint_Type = 'PRIMARY KEY'
            AND Col.Table_Name = '{table}'
        """).fetchone()

        primary_key = primary_key[0] if primary_key else None
        for i in range(n_fields):
            dict_obj = {}
            for j in range(n_attr):
                dict_obj[column_names[j]] = schema[table][i][j]
                dict_obj['IS_PK'] = "YES" if primary_key == schema[table][i][0] else "NO"
            schema[table][i] = dict_obj

    cursor.close()
    column_names = column_names + ['IS_PK']

    return schema, column_names


def write_data(connection: Connection, database: str, data: DataFrame) -> str:
    """
    This function should be called with the correct, cleaned DataFrame,
    since it will attempt writing data directly to the given table.
    By default, it will try to omit as much insertion as possible:
    If a column is detected to be auto-incrementing, or has a default value, or is nullable,
    it will be omitted from the insert statement.

    FIXME: Data with default values is omitted, meaning that such data can never be inserted
    """
    cursor = connection.cursor()

    # before we can continue, we need to make sure that the table exists:
    columns = get_table_schema(connection)[0][database.split('.')[-1]]
    if columns is None:
        raise Exception(f"Table {database} does not exist.")

    # detect and remove from given dataframe:
    # auto-incrementing columns, columns with default values, and nullable columns
    removed_columns = []
    necessary_columns = []
    for column in columns:
        # check if column is auto-incrementing:
        increment_sql = f"""
            SELECT is_identity
            FROM sys.columns
            WHERE name = '{column["COLUMN_NAME"]}'
        """
        cursor.execute(increment_sql)
        auto_increment = cursor.fetchone()[0] == 1

        # check if column has a default value:
        table = database.split('.')[-1]
        default_sql = f"""
            SELECT COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '{table}' AND COLUMN_NAME = '{column["COLUMN_NAME"]}'
        """
        cursor.execute(default_sql)
        default_value = cursor.fetchone()[0] is not None
        if auto_increment or default_value or column["IS_NULLABLE"] == 'YES':
            removed_columns.append(column["COLUMN_NAME"])
        else:
            necessary_columns.append(column["COLUMN_NAME"])

    # remove the unnecessary columns from the DataFrame,
    # but also they may not have existed in the first place
    for col in removed_columns:
        try:
            data = data.drop(columns=col)
        except KeyError:
            pass
    # finally, before we can insert, we need to make sure that the given data
    # has at *least* the bare minimum, necessary columns to complete an insert:
    for column in necessary_columns:
        if column.lower() not in [col.lower() for col in data.columns]:
            raise Exception(f"Column {column} is necessary for table {database}")

    clean_columns = [column for column in data.columns]

    # ensure the Created column is datetime
    try:
        # data["Created"] = data["Created"].apply(lambda x: datetime.utcfromtimestamp(x / 1000))
        pass
    except KeyError:
        pass

    # disclaimer: this code will probably not be able to handle extraneous columns being present,
    # and extra columns being present is not tested.
    # let's hope users only give us excel files with no extra columns, but otherwise, fail
    # FIXME: the above should really be handled better
    if len(data.columns) != len(clean_columns):
        raise Exception("Extra columns detected in data. Make sure that you only have the necessary columns for "
                        f"this table: ${clean_columns}")
    try:
        placeholders = ', '.join(['?' for _ in range(len(data.columns))])
        sql = f"INSERT INTO {database} ({', '.join(clean_columns)}) VALUES ({placeholders})"

        # Execute the INSERT statement with the prepared data
        cursor = connection.cursor()
        cursor.executemany(sql, list(data.itertuples(index=False)))

        # Commit the transaction to save the changes
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        message = "success"
    except Exception as e:
        message = e
    return message


def read_data(connection: pyodbc.Connection, table_name: str) -> List[Dict[str, Any]]:
    """
    This function is used to return all the data from a specified table.
    """
    cursor = connection.cursor()
    # Use a parameterized query to dynamically specify the table_name in the SQL query
    sql_query = "SELECT * FROM {}".format(table_name)
    cursor.execute(sql_query)
    answers = [row_to_dict(row, cursor.description) for row in cursor.fetchall()]
    cursor.close()
    return answers


def row_to_dict(row: pyodbc.Row, columns: List) -> Dict[str, Any]:
    """
    Convert a row from the database result to a dictionary.
    """
    return dict(zip([column[0] for column in columns], row))
