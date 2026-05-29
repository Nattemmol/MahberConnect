'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { notificationService } from '@/lib/api/service-factory';
import { Notification } from '@/lib/api/services/notification.api';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  Wallet
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const t = useTranslations('Notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const { decrementUnreadCount, clearUnreadCount } = useNotificationStore();

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      decrementUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      clearUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment': return <Wallet className="w-5 h-5 text-gold" />;
      case 'event': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Bell className="w-8 h-8 text-gold" />
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0 
              ? t('unreadCount', { count: unreadCount }) 
              : t('allCaughtUp')}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
          </div>
        ) : notifications.length > 0 ? (
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {notifications.map((notification) => (
              <motion.div key={notification.id} variants={itemVariants}>
                <Card 
                  className={`border-border-glass backdrop-blur-md transition-all hover:border-gold/20 ${
                    notification.is_read ? 'bg-surface/30' : 'bg-surface/60 border-gold/10 shadow-sm shadow-gold/5'
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-4">
                      <div className={`p-2.5 rounded-xl bg-background-subtle border border-border-glass shrink-0`}>
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-semibold truncate ${notification.is_read ? 'text-text-primary/80' : 'text-text-primary'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-[11px] text-text-muted flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 leading-relaxed ${notification.is_read ? 'text-text-secondary' : 'text-text-secondary/90'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            {!notification.is_read && (
                              <button 
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs font-medium text-gold hover:underline"
                              >
                                {t('markAsRead')}
                              </button>
                            )}
                            {notification.link && (
                              <Link 
                                href={notification.link}
                                className="text-xs font-medium text-text-secondary hover:text-gold flex items-center gap-1 transition-colors"
                              >
                                {t('viewDetails')}
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                          
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="p-6 bg-surface/40 rounded-full border border-border-glass">
              <Bell className="w-12 h-12 text-text-muted opacity-20" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary">{t('noNotifications')}</h3>
              <p className="text-text-secondary max-w-xs mx-auto mt-2">
                {t('noNotificationsDesc')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
