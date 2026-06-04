import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const navItems = [
  {
    label: "Team",
    icon: "/group-1.png",
    iconAlt: "Group",
    active: true,
  },
  {
    label: "Tasks",
    icon: "/checklist-1.png",
    iconAlt: "Checklist",
    active: false,
  },
  {
    label: "Dashboard",
    icon: "/dashboard-1.png",
    iconAlt: "Dashboard",
    active: false,
  },
  {
    label: "Optimize",
    icon: "/thunder-1.png",
    iconAlt: "Thunder",
    active: false,
  },
];

const skills = ["Skill 1", "Skill 2", "Skill 3", "Skill 4"];

const employees = [
  {
    name: "Employee Name 1",
    role: "Employee Role",
    workloadColor: "bg-[#ffc82c]",
    workloadWidth: "w-[62.96%]",
    borderImage: "/rectangle-32.svg",
  },
  {
    name: "Employee Name 2",
    role: "Employee Role",
    workloadColor: "bg-[#16c60c]",
    workloadWidth: "w-[35.02%]",
    borderImage: "/rectangle-32.svg",
  },
  {
    name: "Employee Name 3",
    role: "Employee Role",
    workloadColor: "bg-[#ff0000]",
    workloadWidth: "w-[90.74%]",
    borderImage: "/rectangle-36.svg",
  },
  {
    name: "Employee Name 4",
    role: "Employee Role",
    workloadColor: "bg-[#ffc82c]",
    workloadWidth: "w-[62.96%]",
    borderImage: "/rectangle-32.svg",
  },
];

export const HomePage = (): JSX.Element => {
  const [selectedView, setSelectedView] = useState<"Employee" | "Teams">(
    "Teams",
  );

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <section className="bg-[#ef7c78] px-6 py-5 text-center">
        <h1 className="m-0 [font-family:'Inter',Helvetica] text-5xl font-bold tracking-[0] text-white leading-[normal]">
          Skill Coverage Optimizer
        </h1>
        <p className="mt-1 [font-family:'Poppins',Helvetica] text-2xl font-normal tracking-[0] text-[#f9f8f8] leading-[normal]">
          Balance workloads and optimize task management
        </p>
      </section>
      <section className="mx-auto flex w-full max-w-[1440px] flex-col px-14 pb-16 pt-9">
        <nav
          aria-label="Primary"
          className="grid grid-cols-4 items-center gap-6"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex h-auto items-center gap-3 self-start rounded-[14px] px-4 py-2 text-left transition-colors ${
                item.active
                  ? "border border-[#f2a7a4] bg-white"
                  : "bg-transparent"
              }`}
            >
              <img
                className={`${item.label === "Dashboard" ? "h-[45px] w-[45px]" : item.label === "Tasks" ? "h-[38px] w-[38px]" : "h-9 w-9"} object-cover`}
                alt={item.iconAlt}
                src={item.icon}
              />
              <span className="[font-family:'Inter',Helvetica] text-2xl font-bold tracking-[0] text-black leading-[normal]">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        <div className="mt-6 flex items-center justify-between gap-6">
          <div
            className="inline-flex h-12 rounded-[28px] border border-solid border-[#fcfcfc] bg-[#7aeaf8] p-px"
            role="tablist"
            aria-label="View selector"
          >
            {(["Employee", "Teams"] as const).map((view) => {
              const active = selectedView === view;

              return (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedView(view)}
                  className={`min-w-[154px] rounded-[28px] px-6 [font-family:'Poppins',Helvetica] text-2xl font-medium tracking-[0] leading-9 transition-colors ${
                    active
                      ? "bg-white text-black border border-solid border-[#7aeaf8]"
                      : "bg-transparent text-black"
                  }`}
                >
                  {view}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            className="h-auto rounded-[6px] bg-[#7aeaf8] px-5 py-2 hover:bg-[#66deee]"
          >
            <span className="mr-2 inline-flex items-center justify-center">
              <img
                className="h-[31px] w-[31px] object-cover"
                alt="Add user"
                src="/add-user--1--1-1.png"
              />
            </span>
            <span className="[font-family:'Inter',Helvetica] text-2xl font-bold tracking-[0] text-[#fffcfc] leading-[normal]">
              ADD Employee
            </span>
          </Button>
        </div>
        <section className="mt-7 grid grid-cols-1 gap-x-28 gap-y-9 md:grid-cols-2">
          {employees.map((employee, _index) => (
            <Card
              key={employee.name}
              className="relative overflow-hidden rounded-[10px] border-0 bg-[#eceaea] shadow-none"
            >
              <img
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                alt="Rectangle"
                src={employee.borderImage}
              />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="[font-family:'Poppins',Helvetica] text-xl font-medium tracking-[0] text-black leading-[normal]">
                      {employee.name}
                    </h2>
                    <p className="mt-1 [font-family:'Poppins',Helvetica] text-xl font-medium tracking-[0] text-[#828181] leading-[normal]">
                      {employee.role}
                    </p>
                  </div>
                  <button type="button" className="shrink-0">
                    <img
                      className="h-5 w-5 object-cover"
                      alt="Delete"
                      src="/delete--1--4.png"
                    />
                  </button>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="[font-family:'Poppins',Helvetica] text-xs font-bold tracking-[0] text-[#828181] leading-[normal]">
                    Workload
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] text-xs font-bold tracking-[0] text-[#828181] leading-[normal]">
                    Workload
                  </span>
                </div>
                <div className="mt-1 h-[5px] w-full rounded-[43.81px] bg-[#0000001a]">
                  <div
                    className={`h-[5px] rounded-[43.81px] ${employee.workloadColor} ${employee.workloadWidth}`}
                  />
                </div>
                <div className="mt-3">
                  <div className="[font-family:'Poppins',Helvetica] text-xs font-bold tracking-[0] text-[#828181] leading-[normal]">
                    Skills
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={`${employee.name}-${skill}`}
                        className="flex h-5 items-center rounded-[28px] border border-solid border-[#7aeaf8] bg-white px-3.5 py-1.5"
                      >
                        <span className="[font-family:'Poppins',Helvetica] text-xs font-medium tracking-[0] text-black leading-[18px] whitespace-nowrap">
                          {skill}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
};
