'use client';

const S = '#d4ac54';
const W = 0.8;

export const symbols = {
  origin: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        <circle cx="60" cy="60" r="20" />
        {[0,60,120,180,240,300].map((a,i)=><circle key={i} cx={60+20*Math.cos(a*Math.PI/180)} cy={60+20*Math.sin(a*Math.PI/180)} r="20" />)}
        <circle cx="60" cy="60" r="40" strokeWidth={W*0.6} opacity={0.4} />
        <circle cx="60" cy="60" r="55" strokeWidth={W*0.4} opacity={0.2} />
        <circle cx="60" cy="60" r="3" fill={S} opacity={0.6} />
      </g>
    </svg>
  ),
  forge: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        {[0,1,2,3,4,5].map(i=>{const a1=(i*60-90)*Math.PI/180;const a2=((i+1)*60-90)*Math.PI/180;return<g key={i}><line x1={60+20*Math.cos(a1)} y1={60+20*Math.sin(a1)} x2={60+20*Math.cos(a2)} y2={60+20*Math.sin(a2)}/><line x1={60+40*Math.cos(a1)} y1={60+40*Math.sin(a1)} x2={60+40*Math.cos(a2)} y2={60+40*Math.sin(a2)}/><line x1="60" y1="60" x2={60+40*Math.cos(a1)} y2={60+40*Math.sin(a1)} strokeWidth={W*0.5} opacity={0.5}/><circle cx={60+40*Math.cos(a1)} cy={60+40*Math.sin(a1)} r="3" strokeWidth={W*0.5}/></g>})}
        <circle cx="60" cy="60" r="2" fill={S} />
      </g>
    </svg>
  ),
  transmissions: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        <polygon points="60,15 95,75 25,75"/><polygon points="60,25 88,68 32,68" strokeWidth={W*0.7}/>
        <polygon points="60,95 25,40 95,40"/><polygon points="60,87 32,45 88,45" strokeWidth={W*0.7}/>
        <circle cx="60" cy="57" r="2.5" fill={S} /><circle cx="60" cy="60" r="50" strokeWidth={W*0.4} opacity={0.25}/>
      </g>
    </svg>
  ),
  resonance: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W*0.7} fill="none">
        <circle cx="60" cy="60" r="15"/>
        {[0,60,120,180,240,300].map((a,i)=><circle key={i} cx={60+15*Math.cos(a*Math.PI/180)} cy={60+15*Math.sin(a*Math.PI/180)} r="15"/>)}
        {[30,90,150,210,270,330].map((a,i)=><circle key={`b${i}`} cx={60+26*Math.cos(a*Math.PI/180)} cy={60+26*Math.sin(a*Math.PI/180)} r="15" opacity={0.5}/>)}
        <circle cx="60" cy="60" r="48" strokeWidth={W*0.4} opacity={0.2}/>
      </g>
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        <circle cx="45" cy="60" r="30"/><circle cx="75" cy="60" r="30"/>
        <ellipse cx="60" cy="60" rx="15" ry="24" strokeWidth={W*0.6}/>
        <circle cx="60" cy="60" r="10" strokeWidth={W*0.8}/><circle cx="60" cy="60" r="4" fill={S}/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=><line key={i} x1={60+26*Math.cos(a*Math.PI/180)} y1={60+26*Math.sin(a*Math.PI/180)} x2={60+34*Math.cos(a*Math.PI/180)} y2={60+34*Math.sin(a*Math.PI/180)} strokeWidth={W*0.3} opacity={0.3}/>)}
      </g>
    </svg>
  ),
  frequencies: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        {[15,25,35,45].map((r,i)=><circle key={i} cx="60" cy="60" r={r} strokeWidth={W*(1-i*0.2)} opacity={1-i*0.2}/>)}
        <circle cx="60" cy="60" r="3" fill={S}/>
        {[0,1,2,3,4,5,6].map(i=>{const a=(i*360/7-90)*Math.PI/180;return<circle key={i} cx={60+38*Math.cos(a)} cy={60+38*Math.sin(a)} r="2" fill={S} opacity={0.5}/>})}
      </g>
    </svg>
  ),
  wavelength: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        <path d="M60,60 Q60,40 75,35 Q95,30 100,50 Q108,75 88,90 Q60,112 38,88 Q10,58 35,30 Q60,2 95,18" strokeWidth={W*0.8}/>
        <path d="M60,60 Q60,48 68,44 Q80,38 85,48 Q92,62 80,72 Q65,85 50,72 Q32,55 45,40 Q58,25 78,32" strokeWidth={W*0.5} opacity={0.5}/>
        <rect x="35" y="35" width="50" height="50" rx="1" strokeWidth={W*0.3} opacity={0.15}/>
        <circle cx="60" cy="60" r="2" fill={S}/>
      </g>
    </svg>
  ),
  signal: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g stroke={S} strokeWidth={W} fill="none">
        <ellipse cx="36" cy="60" rx="22" ry="30" transform="rotate(-15,36,60)" strokeWidth={W*0.7}/>
        <ellipse cx="84" cy="60" rx="22" ry="30" transform="rotate(15,84,60)" strokeWidth={W*0.7}/>
        <path d="M15,60 Q60,20 105,60 Q60,100 15,60Z"/>
        <circle cx="60" cy="60" r="18"/><circle cx="60" cy="60" r="12"/>
        <circle cx="60" cy="60" r="6" fill={S}/><circle cx="60" cy="60" r="2.5" fill={S}/>
        <line x1="60" y1="20" x2="60" y2="8" strokeWidth={W*0.5} opacity={0.4}/>
      </g>
    </svg>
  ),
};

export default function SacredSymbol({ id, className = '' }) {
  return <div className={`transition-all duration-500 ${className}`}>{symbols[id]}</div>;
}
