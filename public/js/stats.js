fetch("/api/transactions")
    .then(res => res.json())
    .then(result => {
        if (!result.ok) return;

        const data = result.data;

        const portfolio = {};

        data.forEach(item => {
            const total = item.price * item.quantity;
            portfolio[item.stock] = (portfolio[item.stock] || 0) + total;
        });

        const labels = Object.keys(portfolio);
        const values = Object.values(portfolio);

        new Chart(document.getElementById("portfolioChart"), {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#1abc9c",
                        "#3498db",
                        "#9b59b6",
                        "#f1c40f",
                        "#e67e22",
                        "#e74c3c"
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#fff"
                        }
                    }
                }
            }
        });
    });
