
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * SkillGapChart
 * Visualises the ATS matching scores using a Radar Chart.
 * Highlights strengths and identifies gaps.
 */
const SkillGapChart = ({ score }) => {
  if (!score) return null;

  const data = [
    { subject: 'Semantic', A: score.semantic_similarity * 100, fullMark: 100 },
    { subject: 'Skills', A: score.skill_match * 100, fullMark: 100 },
    { subject: 'Experience', A: score.experience_alignment * 100, fullMark: 100 },
    { subject: 'Keywords', A: score.keyword_score * 100, fullMark: 100 },
    { subject: 'AI Rank', A: score.ai_score || (score.overall_score), fullMark: 100 },
  ];

  return (
    <div className="chart-container" style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(0,0,0,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Candidate"
            dataKey="A"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillGapChart;
