export default function PageHeader({
  title,
  subtitle,
  badge = null,
  actions = null,
  action = null,
}) {
  const actionContent = actions || action;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-800/60">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {actionContent && <div className="flex items-center gap-3">{actionContent}</div>}
    </div>
  );
}
