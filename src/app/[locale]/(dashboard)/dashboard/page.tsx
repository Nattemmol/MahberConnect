import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-text-primary tracking-tight">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass glass-hover rounded-card p-8 group transition-all duration-500">
          <h3 className="text-text-secondary font-medium tracking-wide uppercase text-xs mb-1">{t('activeMahbers')}</h3>
          <p className="text-4xl font-bold text-gold group-hover:scale-110 transition-transform duration-500 origin-left">3</p>
        </div>
        
        <div className="glass glass-hover rounded-card p-8 group transition-all duration-500">
          <h3 className="text-text-secondary font-medium tracking-wide uppercase text-xs mb-1">{t('totalBalance')}</h3>
          <p className="text-4xl font-bold text-gold group-hover:scale-110 transition-transform duration-500 origin-left">12,500 <span className="text-lg font-medium text-text-secondary">ETB</span></p>
        </div>
        
        <div className="glass glass-hover rounded-card p-8 group transition-all duration-500">
          <h3 className="text-text-secondary font-medium tracking-wide uppercase text-xs mb-1">{t('pendingPayments')}</h3>
          <p className="text-4xl font-bold text-status-warning group-hover:scale-110 transition-transform duration-500 origin-left">1</p>
        </div>
      </div>
      
      <div className="glass rounded-card p-8 shadow-xl shadow-gold/5">
        <h2 className="text-2xl font-semibold mb-6 text-text-primary">{t('recentActivity')}</h2>
        <div className="space-y-2">
          <div className="p-4 rounded-input hover:bg-gold/5 transition-colors flex justify-between items-center group">
            <div>
              <p className="font-semibold text-text-primary group-hover:text-gold transition-colors">{t('monthlyContribution')}</p>
              <p className="text-sm text-text-secondary">Addis Iddir</p>
            </div>
            <div className="text-right">
              <span className="text-status-success font-bold text-lg">+500 ETB</span>
              <p className="text-[10px] text-text-muted mt-0.5">Jan 12, 2024</p>
            </div>
          </div>
          <div className="p-4 rounded-input hover:bg-gold/5 transition-colors flex justify-between items-center group">
            <div>
              <p className="font-semibold text-text-primary group-hover:text-gold transition-colors">{t('meetingAttendance')}</p>
              <p className="text-sm text-text-secondary">Tech Equb</p>
            </div>
            <div className="text-right">
              <span className="text-text-secondary font-medium uppercase text-xs tracking-wider">Present</span>
              <p className="text-[10px] text-text-muted mt-0.5">Yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
