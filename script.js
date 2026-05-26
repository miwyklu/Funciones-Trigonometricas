let myChart = null;

document.getElementById('calculate-btn').addEventListener('click', processIntegral);

function processIntegral() {
    const exprInput = document.getElementById('function-input').value;
    const a = parseFloat(document.getElementById('limit-a').value);
    const b = parseFloat(document.getElementById('limit-b').value);
    
    if (isNaN(a) || !exprInput) {
        alert("Por favor, introduce parámetros válidos.");
        return;
    }

    try {
        // Compilar la expresión matemática usando math.js
        const compiledExpr = math.compile(exprInput);
        
        // Función de evaluación segura
        const f = (x) => {
            const result = compiledExpr.evaluate({ x: x });
            if (typeof result === 'object' && result.isComplex) return result.re; // Evitar quiebres con raíces negativas
            return result;
        };

        // 1. Cálculo numérico de la integral (Regla de Simpson 1/3)
        const n = 100; // Debe ser un número par
        const h = (b - a) / n;
        let integralSum = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            integralSum += (i % 2 === 0) ? 2 * f(x) : 4 * f(x);
        }
        const areaResult = (h / 3) * integralSum;

        // Mostrar resultado redondeado a 4 decimales
        document.getElementById('result-value').innerHTML = `\\(\\int_{${a}}^{${b}} (${exprInput}) \\, dx \\approx ${areaResult.toFixed(4)}\\)`;
        
        // Renderizar o actualizar las fórmulas matemáticas si se usa MathJax (opcional)
        if (window.MathJax) MathJax.typeset();

        // 2. Generar datos para la gráfica
        updateChart(f, a, b, exprInput);

    } catch (error) {
        alert("Error al evaluar la función. Asegúrate de usar una sintaxis válida (ej. x^2, sin(x), log(x)).");
        console.error(error);
    }
}

function updateChart(f, limitA, limitB, labelExpr) {
    const ctx = document.getElementById('integralChart').getContext('2d');
    
    // Configurar rango visual dinámico alrededor de los límites de integración
    const padding = Math.max(Math.abs(limitB - limitA) * 0.5, 1);
    const minX = Math.min(limitA, limitB) - padding;
    const maxX = Math.max(limitA, limitB) + padding;
    
    const steps = 200;
    const stepSize = (maxX - minX) / steps;
    
    const linePoints = [];
    const areaPoints = [];

    for (let i = 0; i <= steps; i++) {
        const x = minX + (i * stepSize);
        let y = f(x);
        
        // Filtrar valores indefinidos o infinitos para que no rompan el gráfico
        if (!isFinite(y) || isNaN(y)) y = null;

        linePoints.push({ x: x, y: y });

        // Si x está dentro de los límites de integración, agregar al set de sombreado
        if (x >= Math.min(limitA, limitB) && x <= Math.max(limitA, limitB)) {
            areaPoints.push({ x: x, y: y });
        }
    }

    // Destruir el gráfico previo si ya existe para evitar duplicación de render
    if (myChart) {
        myChart.destroy();
    }

    // Configuración y construcción del gráfico usando Chart.js
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `f(x) = ${labelExpr}`,
                    data: linePoints,
                    borderColor: '#3182ce',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Área integrada',
                    data: areaPoints,
                    backgroundColor: 'rgba(49, 130, 206, 0.25)',
                    borderColor: 'transparent',
                    pointRadius: 0,
                    fill: 'origin' // Rellena el espacio hacia el eje X
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Eje X' }
                },
                y: {
                    type: 'linear',
                    title: { display: true, text: 'Eje Y' }
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });
}

// Ejecutar el primer cálculo al cargar la página
window.onload = processIntegral;
