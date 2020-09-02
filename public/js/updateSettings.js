import Axios from "axios";
import { showAlert } from './alerts.js';

// 'type' is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    try {
        const url = type == 'password' ? 'http://127.0.0.1:5000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:5000/api/v1/users/updateMe';
        const res = await Axios({
            method: 'PATCH',        //reques t update
            url,
            data
        });
        if (res.data.status == 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfuly`);
        }
    } catch (error) {
        showAlert('error', err.response.data.message);
    }
}


