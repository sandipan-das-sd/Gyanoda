declare module 'razorpay' {
    interface RazorpayOrder {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        created_at: number;
        notes: any;
    }

    interface RazorpayPayment {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string;
        captured: boolean;
        description: string;
        card_id: string;
        bank: string;
        wallet: string;
        vpa: string;
        email: string;
        contact: string;
        created_at: number;
        notes: any;
    }

    class Razorpay {
        constructor(options: { key_id: string; key_secret: string });

        orders: {
            create(data: { amount: number; currency: string; receipt: string; payment_capture: number }): Promise<RazorpayOrder>;
        };

        payments: {
            fetch(paymentId: string): Promise<RazorpayPayment>;
        };
    }

    export = Razorpay;
}
