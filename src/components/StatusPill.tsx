export default function StatusPill({value}:{value:string}){return <span className={`status status-${value.toLowerCase().replaceAll(' ','-')}`}>{value}</span>}
