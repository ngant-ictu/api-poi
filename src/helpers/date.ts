export const getCurrentDate = () => {
    const month_names = ["Jan", "Feb", "Mar",
        "Apr", "May", "Jun",
        "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec"];

    let today: any = new Date();
    let dd: any = today.getDate();
    let mm: any = month_names[today.getMonth()];

    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    return `${yyyy}/${mm}/${dd}`;
}
