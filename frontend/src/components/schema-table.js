import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
    Paper,
    TableContainer,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {useState} from "react";

const SchemaTable = ({headings, rows, columns, setColumns}) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const handleChange = (newValue, index) => {
        let newArray = [...columns];
        newArray[index] = newValue;
        setColumns([...newArray]);
    };

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 650}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        {headings.map((heading) => {
                            return (
                                <TableCell sx={{fontSize: 12}} key={heading}>
                                    {heading}
                                </TableCell>
                            );
                        })}
                        <TableCell>Location</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, index) => {
                        return (
                            <TableRow
                                key={index}
                                sx={{
                                    "&:last-child td, &:last-child th": {border: 0},
                                }}
                            >
                                {Object.keys(row).map((key, index) => {
                                    return (
                                        <TableCell sx={{fontSize: 12}} key={index}>
                                            {row[key]}
                                        </TableCell>
                                    );
                                })}
                                {row["IS_PK"] !== "YES" && columns ? (
                                    <TableCell>
                                        <label htmlFor="column">Columns</label>
                                        <br></br>
                                        <select
                                            id="column"
                                            value={columns[index]}
                                            placeholder="Column"
                                            onChange={(event) =>
                                                handleChange(event.target.value, index)
                                            }
                                        >
                                            <option value="">Select Column</option>

                                            {alphabet.map((letter) => {
                                                return <option key={letter} value={letter}>{letter}</option>;
                                            })}
                                        </select>
                                    </TableCell>
                                ) : (
                                    <TableCell>N/A</TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default SchemaTable;
