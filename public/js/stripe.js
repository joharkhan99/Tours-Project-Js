import Axios from "axios";
import Stripe from "stripe";
import { showAlert } from "./alerts";

const stripe = new Stripe('pk_test_51HMGn7InPcEyJT1zwDM2OcI2TE9EZ600wmJWJW9qqv503d3MRx4CXPfpx3fiB1QRAqBsuBq8Sf0yIdErknD2JLBi00GBVBrQOc');

export const bookTour = async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await Axios(`http://127.0.0.1:5000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (error) {
        console.log(error);
        showAlert('error', error);
    }
};
