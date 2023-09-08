import {
    Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, TextField,
} from "@mui/material";
import {postExcel, getTables, readData} from "../utils/api";
import SchemaTable from "../components/schema-table.js";
import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useQuery} from "react-query";
import toast, {Toaster} from 'react-hot-toast';

const UploadExcel = () => {
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const {data, isLoading} = useQuery("tables", getTables);

    const [table, setTable] = useState("");

    const [tables, setTables] = useState({});

    const [columns, setColumns] = useState([]);
    const [serverText, setServerText] = useState("");
    const [databaseText, setDatabaseText] = useState("");
    const [schemaText, setSchemaText] = useState("");
    const [tableText, setTableText] = useState("");
    const [usernameText, setUsernameText] = useState("");
    const [pwdText, setPwdText] = useState("");

    useEffect(() => {
        if (data) {
            setTables(data.data);
        }
    }, [data]);

    useEffect(() => {
        if (tables && table) {
            let newArray = tables.tables[table].map((row) => {
                return "";
            });
            setColumns([...newArray]);
        }
    }, [table, tables]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const isValidResponse = () => {
        if (!table || !file) {
            return false;
        }

        // search for missing fields in columns
        const n = columns ? columns.length : 0;
        let hashtable = [];

        for (let i = 0; i < n; i++) {
            if (!tables.tables[table]) {
                return false;
            }
            if (tables?.tables[table][i]["IS_PK"] === "YES") {
                continue;
            }

            if (!columns[i] && tables?.tables[table][i]["IS_NULLABLE"] !== "YES") {
                // check if filled
                return false;
            }

            // check for duplicates
            if (tables?.tables[table][i]["IS_NULLABLE"] !== "YES") {
                if (columns[i] in hashtable) {
                    return false;
                } else {
                    hashtable[columns[i]] = columns[i];
                }
            } else if (tables?.tables[table][i]["IS_NULLABLE"] === "YES") {
                if (columns[i] && columns[i] in hashtable) {
                    return false;
                }
            }
        }

        return true;
    };

    const handleClear = () => {
        let clearedArr = [...columns];
        clearedArr = columns.map((_column) => {
            return "";
        });
        setColumns([...clearedArr]);
    };

    const handleSubmit = async (_event) => {
        // join columns array with table data
        const selectedTable = tables.tables[table];
        let metadata = [...selectedTable];
        for (let i in metadata) {
            if (metadata[i]["IS_PK"] !== "YES") {
                metadata[i]["location"] = columns[i];
            }
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("table", table);
        formData.append("metadata", JSON.stringify(metadata));

        const response = await postExcel(formData);

        if (response.status === 200 && response.data.message === "success") {
            setFile(null);
            navigate("/success");
        } else {
            toast.error("File upload failed! " + response.data.message);
        }
    };

    const handleReadData = async (_event) => {
        if (!pwdText || !usernameText || !serverText || !databaseText) {
            await readData("[dev.Wissp].[dbo].[Answers]", false);
        } else if (schemaText && tableText) {
            await readData(`[${databaseText}].[${schemaText}].[${tableText}]`, true, serverText, databaseText, usernameText, pwdText);
        }
    };

    return (<Box sx={{mt: 3, ml: 3}}>
        <Typography variant="h4" sx={{fontWeight: "bold", mb: 3}}>
            Upload a spreadsheet in the specified format:
        </Typography>
        <Toaster/>
        <input
            type="file"
            onChange={(e) => {
                setFile(e.target.files[0]);
            }}
            accept=".xls, .xlsx"
            style={{marginBottom: 20}}
            required
        />
        <br/>
        {!isLoading && (<FormControl>
            <InputLabel id="demo-simple-select-label">Table</InputLabel>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={table}
                label="Table"
                onChange={(event) => {
                    setTable(event.target.value);
                }}
                sx={{width: 180}}
            >
                {Object.keys(data.data.tables).map((table) => {
                    return (<MenuItem key={table} value={table}>
                        {table}
                    </MenuItem>);
                })}
            </Select>
        </FormControl>)}
        <br/>
        <br/>

        <Typography variant="h5" sx={{fontWeight: "bold"}}>
            Table Schema
        </Typography>
        {!isLoading && table !== "" && (<SchemaTable
            headings={tables.attr}
            rows={data.data.tables[table]}
            columns={columns}
            setColumns={setColumns}
        />)}
        <Box sx={{mt: 3}}>
            <Typography variant="h6">
                Optional: Enter the server, database, schema, and table as well as
                user credentials to read directly from your database
            </Typography>
            <span>
          <TextField
              placeholder="Enter server"
              value={serverText}
              onChange={(e) => setServerText(e.target.value)}
              size="small"
          />
        </span>
            <span>
          <TextField
              placeholder="Enter database"
              value={databaseText}
              onChange={(e) => setDatabaseText(e.target.value)}
              size="small"
          />
        </span>
            <span>
          <TextField
              placeholder="Enter schema"
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              size="small"
          />
        </span>
            <span>
          <TextField
              placeholder="Enter table"
              value={tableText}
              onChange={(e) => setTableText(e.target.value)}
              size="small"
          />
        </span>
            <span>
          <TextField
              placeholder="Enter username"
              value={usernameText}
              onChange={(e) => setUsernameText(e.target.value)}
              size="small"
          />
        </span>
            <span>
          <TextField
              placeholder="Enter password"
              value={pwdText}
              onChange={(e) => setPwdText(e.target.value)}
              size="small"
          />
        </span>
        </Box>
        <Button
            type="button"
            variant="contained"
            onClick={handleClear}
            sx={{mt: 3, mr: 3}}
        >
            Clear
        </Button>

        <Button
            type="button"
            variant="contained"
            color="success"
            onClick={handleSubmit}
            sx={{mt: 3, mr: 3}}
            disabled={!isValidResponse()}
        >
            Submit
        </Button>
        <Button
            type="button"
            variant="contained"
            color="success"
            onClick={handleReadData}
            sx={{mt: 3}}
        >
            Read Table
        </Button>
    </Box>);
};

export default UploadExcel;
