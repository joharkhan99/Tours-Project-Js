//babel/polyfil is used to support some old versions of js
import '@babel/polyfill';   //we dont need to store it in var
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { signup } from "./signup";

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.querySelector('#book-tour');
const signUpForm = document.querySelector(".form--signup");

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);//as locations was a string so conv it to JSON
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        e.preventDefault();
        login(email, password);
    });
}

if (signUpForm) {
    signUpForm.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.querySelector('#name').value;
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        const passwordConfirm = document.querySelector('#passwordConfirm').value;
        signup(name, email, password, passwordConfirm);
    });
};

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const form = new FormData();        //make a new form data object
        form.append('name', document.querySelector('#name').value); //append data
        form.append('email', document.querySelector('#email').value);
        //photo has no value instead it has file
        form.append('photo', document.querySelector('#photo').files[0]);

        updateSettings(form, 'data');
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating ...';

        const passwordCurrent = document.querySelector('#password-current').value;
        const password = document.querySelector('#password').value;
        const passwordConfirm = document.querySelector('#password-confirm').value;
        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

        document.querySelector('.btn--save-password').textContent = 'Save password';
        document.querySelector('#password-current').value = '';
        document.querySelector('#password').value = '';
        document.querySelector('#password-confirm').value = '';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });
}
