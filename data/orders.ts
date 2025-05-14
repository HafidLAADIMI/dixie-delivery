export  type Order = {
    id: string;
    customer: string;
    phone: string;
    address: string;
    cod: number;
    quantity: number;
    status: "Pending" | "Delivered" | "Returned";
    lat: number;
    lng: number;
};

export const orders: Order[] = [
    {
        id: "51182441",
        customer: "Alex Gratereaux",
        phone: "+880 1500 000 000",
        address: "H#15, R#7/18, Banani, PO:1229, Dhaka",
        cod: 437,
        quantity: 3,
        status: "Pending",
        lat: 23.8044,
        lng: 90.3661,
    },
    {
        id: "51182430",
        customer: "Abdullah",
        phone: "+880 1500 000 012",
        address: "43/0B Mirpur 13, Dhaka 1216",
        cod: 0,
        quantity: 1,
        status: "Delivered",
        lat: 23.8072,
        lng: 90.3689,
    },
    // …add the rest
];


