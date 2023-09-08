import axios from "axios";

const API_ENDPOINT = process.env.REACT_APP_API_HOST;

/**
 * Post excel file to server
 * @param formData - form data
 * @returns {Promise<axios.AxiosResponse<any>>} - response
 */

export async function postExcel(formData) {
  const data = await axios.post(`${API_ENDPOINT}/extract-excel`, formData, {
    headers: {
      "content-type": "multipart/form-data",
    },
  });
  return await axios.post(
    `${API_ENDPOINT}/write-data/${formData.get("table")}`,
    data["data"]
  );
}

/**
 * Get all tables
 * @returns {Promise<axios.AxiosResponse<any>>} - response
 */
export async function getTables() {
  return await axios.get(`${API_ENDPOINT}/get-tables`);
}

/**
 * Read data from table
 * @param tableName {string} - table name
 * @returns {Promise<axios.AxiosResponse<any>>} - response
 */

export async function readData(
  tableName,
  new_db,
  serverText = "",
  databaseText = "",
  usernameText = "",
  pwdText = ""
) {
  if (!new_db) {
    return await axios.get(
      `${process.env.REACT_APP_API_HOST}/read-data/${tableName}`
    );
  } else {
    const parameters = {
      table: tableName,
      server: serverText,
      database: databaseText,
      username: usernameText,
      pwd: pwdText,
    };
    return await axios.post(
      `${process.env.REACT_APP_API_HOST}/read-new-data`,
      parameters
    );
  }
}


export async function writeData(){

}
