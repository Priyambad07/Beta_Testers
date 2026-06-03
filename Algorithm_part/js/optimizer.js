// Check whether employee can take the task
function isEligible(employee, task) {

    const hasSkills =
        task.requiredSkills.every(skill =>
            employee.skills.some(
                s => s.name === skill
            )
        );

    const remainingCapacity =
        employee.capacity - employee.workload;

    const hasCapacity =
        remainingCapacity >= task.effort;

    return hasSkills && hasCapacity;
}


// Calculate suitability score
function calculateScore(employee, task) {

    let matchedSkills = 0;
    let proficiencyTotal = 0;

    task.requiredSkills.forEach(skill => {

        const empSkill =
            employee.skills.find(
                s => s.name === skill
            );

        if (empSkill) {

            matchedSkills++;

            proficiencyTotal +=
                proficiencyWeights[
                    empSkill.proficiency
                ];
        }

    });

    if (matchedSkills === 0)
        return 0;

    const avgProficiency =
        proficiencyTotal / matchedSkills;

    return (
        (matchedSkills /
            task.requiredSkills.length)
        *
        avgProficiency
        *
        priorityWeights[task.priority]
        *
        100
    );
}


// Sort tasks by priority
function sortTasks(tasks) {

    const order = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1
    };

    return tasks.sort(
        (a, b) =>
            order[b.priority] -
            order[a.priority]
    );
}


// Main Greedy Optimizer
function generateRecommendations() {

    const sortedTasks =
        sortTasks([...tasks]);

    const allocations = [];

    sortedTasks.forEach(task => {

        let bestEmployee = null;
        let bestScore = -1;

        employees.forEach(employee => {

            if (!isEligible(employee, task))
                return;

            const score =
                calculateScore(
                    employee,
                    task
                );

            if (
                score > bestScore ||
                (
                    score === bestScore &&
                    employee.workload <
                    (bestEmployee?.workload ?? Infinity)
                )
            ) {
                bestEmployee = employee;
                bestScore = score;
            }

        });

        if (bestEmployee) {

            allocations.push({

                task: task.name,

                priority: task.priority,

                employee: bestEmployee.name,

                score: bestScore.toFixed(2),

                effort: task.effort,

                workloadBefore:
                    bestEmployee.workload,

                workloadAfter:
                    bestEmployee.workload +
                    task.effort
            });

            // Update workload after allocation
            bestEmployee.workload +=
                task.effort;
        }

    });

    return allocations;
}