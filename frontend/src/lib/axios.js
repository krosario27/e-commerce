import axios from axios;

const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? "http://localhost:5001/api" : "/api",
    withCredentials: true, // this is needed to send the cookies along with the request
});

export default axiosInstance;