import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:5000/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        if (res.data.status == 'success') {   //check if user is logged in
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {         //then load home page
                location.assign('/');       //assign this route to location
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:5000/api/v1/users/logout'
        });
        if ((res.data.status = 'success')) {  //if status is success
            location.reload(true);  //load the server not only page
        }
    } catch (err) {
        console.log(err);
        showAlert('error', 'Error logging out! try again');
    }
};


