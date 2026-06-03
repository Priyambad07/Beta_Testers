document
.getElementById("run-btn")
.addEventListener("click", () => {

    const allocations =
        generateRecommendations();


    const resultDiv =
        document.getElementById("result-list");

    resultDiv.innerHTML = "";

    allocations.forEach(a => {

        resultDiv.innerHTML += `
        <tr>

            <td>${a.task}</td>

            <td>
                <span class="badge ${a.priority}">
                    ${a.priority.toUpperCase()}
                </span>
            </td>

            <td>${a.employee}</td>

            <td>
                <strong>${a.score}</strong>
            </td>

        </tr>
        `;
    });


    const empDiv =
        document.getElementById("emp-result-list");

    empDiv.innerHTML = "";

    employees.forEach(emp => {

        const percent =
            (emp.workload / emp.capacity) * 100;

        const remaining =
            emp.capacity - emp.workload;

        empDiv.innerHTML += `
        <tr>

            <td>
                👤 ${emp.name}
            </td>

            <td>

                <div class="progress">

                    <div
                        class="fill"
                        style="width:${percent}%">
                    </div>

                </div>

                ${emp.workload}/${emp.capacity} hrs

            </td>

            <td>
                ${remaining} hrs
            </td>

        </tr>
        `;
    });



    document.getElementById("summary")
    .innerHTML = `

        <div class="stat-card">
            <h3>👨‍💻 ${employees.length}</h3>
            <p>Total Employees</p>
        </div>

        <div class="stat-card">
            <h3>📋 ${tasks.length}</h3>
            <p>Total Tasks</p>
        </div>

        <div class="stat-card">
            <h3>✅ ${allocations.length}</h3>
            <p>Assignments Generated</p>
        </div>

        <div class="stat-card">
            <h3>🔥 ${
                tasks.filter(
                    t => t.priority === "urgent"
                ).length
            }</h3>
            <p>Urgent Tasks</p>
        </div>

    `;
});