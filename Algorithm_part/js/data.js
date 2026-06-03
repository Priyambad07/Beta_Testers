const employees = [
{
    id: 1,
    name: "Shruti",
    capacity: 40,
    workload: 4,
    skills: [
        { name: "PostgreSQL", proficiency: "expert" },
        { name: "Python", proficiency: "intermediate" },
        { name: "REST API Design", proficiency: "intermediate" }
    ]
},
{
    id: 2,
    name: "xyz",
    capacity: 40,
    workload: 12,
    skills: [
        { name: "Machine Learning", proficiency: "expert" },
        { name: "Data Analysis", proficiency: "expert" },
        { name: "Python", proficiency: "expert" }
    ]
},
{
    id: 3,
    name: "Anika",
    capacity: 40,
    workload: 8,
    skills: [
        { name: "React", proficiency: "expert" },
        { name: "TypeScript", proficiency: "expert" },
        { name: "UI/UX Design", proficiency: "expert" }
    ]
},
{
    id: 4,
    name: "Rohan",
    capacity: 40,
    workload: 16,
    skills: [
        { name: "Python", proficiency: "expert" },
        { name: "FastAPI", proficiency: "expert" },
        { name: "Docker", proficiency: "intermediate" }
    ]
},
{
    id: 5,
    name: "Meera",
    capacity: 40,
    workload: 10,
    skills: [
        { name: "React", proficiency: "intermediate" },
        { name: "Python", proficiency: "intermediate" },
        { name: "Docker", proficiency: "expert" }
    ]
},
{
    id: 6,
    name: "Arjun",
    capacity: 40,
    workload: 5,
    skills: [
        { name: "Java", proficiency: "expert" },
        { name: "Spring Boot", proficiency: "expert" },
        { name: "Docker", proficiency: "intermediate" }
    ]
},
{
    id: 7,
    name: "Priya",
    capacity: 40,
    workload: 14,
    skills: [
        { name: "Data Analysis", proficiency: "expert" },
        { name: "Power BI", proficiency: "expert" },
        { name: "SQL", proficiency: "intermediate" }
    ]
},
{
    id: 8,
    name: "Vivek",
    capacity: 40,
    workload: 7,
    skills: [
        { name: "AWS", proficiency: "expert" },
        { name: "Docker", proficiency: "expert" },
        { name: "Python", proficiency: "intermediate" }
    ]
},
{
    id: 9,
    name: "Neha",
    capacity: 40,
    workload: 6,
    skills: [
        { name: "UI/UX Design", proficiency: "expert" },
        { name: "React", proficiency: "intermediate" },
        { name: "Figma", proficiency: "expert" }
    ]
},
{
    id: 10,
    name: "Karan",
    capacity: 40,
    workload: 18,
    skills: [
        { name: "Machine Learning", proficiency: "intermediate" },
        { name: "Python", proficiency: "expert" },
        { name: "SQL", proficiency: "expert" }
    ]
}
];

const tasks = [
{
    id: 1,
    name: "Build Recommendation Engine",
    effort: 12,
    priority: "urgent",
    requiredSkills: ["Machine Learning", "Python"]
},
{
    id: 2,
    name: "Create Analytics Dashboard",
    effort: 8,
    priority: "high",
    requiredSkills: ["Data Analysis"]
},
{
    id: 3,
    name: "Develop REST APIs",
    effort: 10,
    priority: "high",
    requiredSkills: ["Python", "FastAPI"]
},
{
    id: 4,
    name: "Database Optimization",
    effort: 6,
    priority: "medium",
    requiredSkills: ["PostgreSQL"]
},
{
    id: 5,
    name: "Deploy Application",
    effort: 5,
    priority: "urgent",
    requiredSkills: ["AWS", "Docker"]
},
{
    id: 6,
    name: "UI Redesign",
    effort: 7,
    priority: "medium",
    requiredSkills: ["UI/UX Design"]
},
{
    id: 7,
    name: "Frontend Dashboard",
    effort: 10,
    priority: "high",
    requiredSkills: ["React", "TypeScript"]
},
{
    id: 8,
    name: "Customer Insights Report",
    effort: 4,
    priority: "low",
    requiredSkills: ["Data Analysis"]
},
{
    id: 9,
    name: "Containerization",
    effort: 6,
    priority: "medium",
    requiredSkills: ["Docker"]
},
{
    id: 10,
    name: "Spring Boot Service",
    effort: 8,
    priority: "high",
    requiredSkills: ["Java", "Spring Boot"]
},
{
    id: 11,
    name: "SQL Reporting",
    effort: 5,
    priority: "medium",
    requiredSkills: ["SQL"]
},
{
    id: 12,
    name: "Model Training Pipeline",
    effort: 15,
    priority: "urgent",
    requiredSkills: ["Machine Learning", "Python"]
},
{
    id: 13,
    name: "Cloud Monitoring Setup",
    effort: 4,
    priority: "medium",
    requiredSkills: ["AWS"]
},
{
    id: 14,
    name: "Figma Prototype",
    effort: 3,
    priority: "low",
    requiredSkills: ["Figma"]
},
{
    id: 15,
    name: "Data Cleaning",
    effort: 5,
    priority: "high",
    requiredSkills: ["Data Analysis"]
},
{
    id: 16,
    name: "Authentication Module",
    effort: 9,
    priority: "high",
    requiredSkills: ["Python"]
},
{
    id: 17,
    name: "Docker CI/CD Setup",
    effort: 8,
    priority: "urgent",
    requiredSkills: ["Docker"]
},
{
    id: 18,
    name: "Power BI Dashboard",
    effort: 6,
    priority: "medium",
    requiredSkills: ["Power BI"]
},
{
    id: 19,
    name: "Backend Refactoring",
    effort: 7,
    priority: "medium",
    requiredSkills: ["Python"]
},
{
    id: 20,
    name: "UX Research",
    effort: 4,
    priority: "low",
    requiredSkills: ["UI/UX Design"]
}
];