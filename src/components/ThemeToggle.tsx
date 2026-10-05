import type {ThemeName} from '../types';
export default function ThemeToggle({theme,onChange}:{theme:ThemeName;onChange:(v:ThemeName)=>void}){return <button className="icon-button" onClick={()=>onChange(theme==='light'?'dark':'light')} aria-label="Toggle day/night mode">{theme==='light'?'☾':'☀'}</button>}
