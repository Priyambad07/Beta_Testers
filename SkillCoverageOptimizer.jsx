import React, { useState, useMemo } from 'react';

// Sample Data - In a real app, this would come from props or an API
const DEFAULT_REQUIRED_SKILLS = ['React', 'Node.js', 'Python', 'AWS', 'UI/UX Design', 'TypeScript'];

const DEFAULT_TEAM_POOL = [
  { id: 1, name: 'Alice Smith', skills: ['React', 'TypeScript', 'UI/UX Design'] },
  { id: 2, name: 'Bob Jones', skills: ['Node.js', 'AWS', 'Python'] },
  { id: 3, name: 'Charlie Brown', skills: ['React', 'Node.js'] },
  { id: 4, name: 'Diana Prince', skills: ['Python', 'AWS'] },
  { id: 5, name: 'Evan Wright', skills: ['UI/UX Design', 'TypeScript'] },
];

export default function SkillCoverageOptimizer() {
  const [requiredSkills] = useState(DEFAULT_REQUIRED_SKILLS);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Toggle team member selection
  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Calculate current coverage metrics
  const coverageStats = useMemo(() => {
    const coveredSkillsSet = new Set();
    
    // Get all unique skills from selected members
    selectedMembers.forEach((memberId) => {
      const member = DEFAULT_TEAM_POOL.find((m) => m.id === memberId);
      if (member) {
        member.skills.forEach((skill) => {
          if (requiredSkills.includes(skill)) {
            coveredSkillsSet.add(skill);
          }
        });
      }
    });

    const coveredCount = coveredSkillsSet.size;
    const totalCount = requiredSkills.length;
    const percentage = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
    const missingSkills = requiredSkills.filter((skill) => !coveredSkillsSet.has(skill));

    return {
      percentage,
      coveredCount,
      totalCount,
      missingSkills,
    };
  }, [selectedMembers, requiredSkills]);

  // Greedy Algorithm to suggest the optimal team configuration
  const suggestOptimalTeam = () => {
    let uncovered = [...requiredSkills];
    const pool = [...DEFAULT_TEAM_POOL];
    const suggestedIds = [];

    while (uncovered.length > 0 && pool.length > 0) {
      // Sort remaining members by how many uncovered skills they can satisfy
      pool.sort((a, b) => {
        const aMatches = a.skills.filter((s) => uncovered.includes(s)).length;
        const bMatches = b.skills.filter((s) => uncovered.includes(s)).length;
        return bMatches - aMatches; // Descending
      });

      const bestMatch = pool[0];
      const matchesCount = bestMatch.skills.filter((s) => uncovered.includes(s)).length;

      // If the best candidate adds no new skills, we've maxed out coverage
      if (matchesCount === 0) break;

      suggestedIds.push(bestMatch.id);
      // Remove covered skills from the checklist
      uncovered = uncovered.filter((s) => !bestMatch.skills.includes(s));
      // Remove candidate from pool
      pool.shift();
    }

    setSelectedMembers(suggestedIds);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Skill Coverage Optimizer</h2>
      <p style={{ color: '#666' }}>Build your team and track required skill coverage in real-time.</p>

      {/* Progress Bar Section */}
      <div style={{ marginBottom: '24px', background: '#f0f0f0', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
          <strong>Coverage: {coverageStats.percentage}%</strong>
          <span style={{ marginLeft: 'auto' }}>({coverageStats.coveredCount} of {coverageStats.totalCount} skills)</span>
        </div>
        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '12px', width: '100%', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${coverageStats.percentage}%`, 
              background: coverageStats.percentage === 100 ? '#4CAF50' : '#2196F3', 
              height: '100%', 
              transition: 'width 0.3s ease' 
            }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Team Selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Available Talent Pool</h3>
            <button 
              onClick={suggestOptimalTeam}
              style={{ background: '#6200ee', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              🪄 Auto-Optimize
            </button>
          </div>
          
          {DEFAULT_TEAM_POOL.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            return (
              <div 
                key={member.id}
                onClick={() => toggleMember(member.id)}
                style={{
                  border: `2px solid ${isSelected ? '#2196F3' : '#e0e0e0'}`,
                  background: isSelected ? '#e3f2fd' : 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                <div style={{ marginTop: '4px' }}>
                  {member.skills.map(s => (
                    <span key={s} style={{ fontSize: '12px', background: '#eee', padding: '2px 6px', marginRight: '4px', borderRadius: '4px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Requirements Checklist */}
        <div>
          <h3>Required Skills Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {requiredSkills.map((skill) => {
              const isCovered = !coverageStats.missingSkills.includes(skill);
              return (
                <div 
                  key={skill} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '10px', 
                    background: isCovered ? '#e8f5e9' : '#ffebee',
                    borderRadius: '6px',
                    color: isCovered ? '#2e7d32' : '#c62828'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{isCovered ? '✅' : '❌'}</span>
                  <span>{skill}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}