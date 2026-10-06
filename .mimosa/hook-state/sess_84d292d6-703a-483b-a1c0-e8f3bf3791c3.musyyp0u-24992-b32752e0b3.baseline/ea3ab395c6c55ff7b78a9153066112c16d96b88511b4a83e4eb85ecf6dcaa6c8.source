import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Play, CheckCircle2, Lock, BookOpen, Clock, Award, ChevronRight, TrendingUp, BarChart2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const coursesData = [
  { 
    id: 1, 
    titleKey: 'Fundamentals',
    title: 'Market Fundamentals', 
    description: 'Master the core mechanics of order books, liquidity, and basic market structures.',
    progress: 100, 
    modules: 5, 
    duration: '2.5h',
    level: 'Beginner',
    levelKey: 'beginner',
    image: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
    icon: BookOpen,
    color: 'text-indigo-400'
  },
  { 
    id: 2, 
    titleKey: 'Analysis',
    title: 'Technical Analysis I', 
    description: 'Learn to read price action, identify trends, and utilize basic indicators effectively.',
    progress: 60, 
    modules: 8, 
    duration: '4h',
    level: 'Intermediate',
    levelKey: 'intermediate',
    image: 'bg-gradient-to-br from-accent-primary/20 to-orange-500/20',
    icon: TrendingUp,
    color: 'text-accent-primary'
  },
  { 
    id: 3, 
    titleKey: 'Risk',
    title: 'Risk Management Protocols', 
    description: 'Advanced position sizing, portfolio correlation, and drawdown mitigation strategies.',
    progress: 0, 
    modules: 6, 
    duration: '3.5h',
    level: 'Advanced',
    levelKey: 'advanced',
    image: 'bg-gradient-to-br from-accent-secondary/20 to-emerald-500/20',
    icon: Shield,
    color: 'text-accent-secondary'
  },
  { 
    id: 4, 
    titleKey: 'Algo',
    title: 'Algorithmic Trading Basics', 
    description: 'Introduction to quantitative models, backtesting, and automated execution systems.',
    progress: 0, 
    modules: 10, 
    duration: '6h',
    level: 'Expert',
    levelKey: 'expert',
    image: 'bg-gradient-to-br from-accent-quaternary/20 to-rose-500/20',
    icon: BarChart2,
    color: 'text-accent-quaternary',
    locked: true
  }
];

export const Academy: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <GraduationCap className="text-indigo-400" size={28} />
            {t('tradingAcademy')}
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            {t('academyGoal')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 relative z-10">
        {/* Main Dashboard */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Progress Overview */}
          <div className="glass-card p-8 border-indigo-500/20 relative overflow-hidden holo-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2">{t('curriculumStatus')}</p>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {t('curriculumProgress', { percent: 30 })}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>{t('overallProgress')}</span>
                    <span className="text-white">3 / 10 Modules</span>
                  </div>
                  <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '30%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-3">
                <button className="px-8 py-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-sm font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 group">
                  <Play size={18} className="fill-current" />
                  {t('resumeCourse')}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{t('hoursLearned')}</p>
                <p className="text-xl font-bold font-mono text-white">4.5h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{t('coursesCompleted')}</p>
                <p className="text-xl font-bold font-mono text-white">1</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{t('rewards')}</p>
                <p className="text-xl font-bold font-mono text-white">1</p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white uppercase tracking-widest mt-8 mb-4">{t('availableCourses')}</h3>
          
          {/* Courses List */}
          <div className="space-y-4">
            {coursesData.map((course, idx) => {
              const Icon = course.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={course.id}
                  className={`p-1 rounded-2xl bg-gradient-to-r ${course.progress === 100 ? 'from-accent-secondary/20 via-transparent to-transparent' : course.locked ? 'from-[#111] to-[#0A0A0A]' : 'from-accent-primary/10 via-transparent to-transparent'} border ${course.locked ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-white/20'} transition-all group`}
                >
                  <div className="p-5 rounded-xl bg-[#0a0a0a] flex flex-col md:flex-row items-start md:items-center gap-5 relative overflow-hidden">
                    {course.locked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Lock size={24} className="text-slate-400" />
                      </div>
                    )}
                    
                    {/* Course Graphic */}
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center shrink-0 ${course.image} border border-white/5 relative z-10`}>
                      <Icon size={32} className={`drop-shadow-md ${course.color}`} />
                    </div>

                    <div className="flex-1 w-full relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{t(course.titleKey, { defaultValue: course.title })}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
                          {t(course.levelKey)}
                        </span>
                        {course.progress === 100 && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary flex items-center gap-1">
                            <CheckCircle2 size={10} /> {t('completed')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2 md:line-clamp-1">{course.description}</p>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><BookOpen size={14} /> {t('modulesCount', { count: course.modules })}</div>
                        <div className="flex items-center gap-1.5"><Clock size={14} /> {course.duration}</div>
                        
                        {/* Progress Bar Mini */}
                        <div className="flex-1 max-w-[200px] flex items-center gap-3">
                          <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${course.progress === 100 ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-accent-primary shadow-neon-gold'}`} 
                              style={{ width: `${course.progress}%` }} 
                            />
                          </div>
                          <span>{course.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto relative z-10">
                      {!course.locked && course.progress < 100 && (
                        <button className="w-full md:w-auto mt-4 md:mt-0 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white border border-white/10 flex items-center justify-center">
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Active Lesson Profile */}
          <div className="glass-card p-6 border-accent-primary/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">{t('currentFocus')}</h3>
            
            <div className="space-y-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden relative group">
                <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800" alt="lesson" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent-primary/80 backdrop-blur-md flex items-center justify-center shadow-neon-gold text-black group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={20} className="fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-[10px] font-mono font-bold text-white rounded">
                  12:45
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-accent-primary mb-1">Module 4: Reading Price Action</p>
                <h4 className="text-base font-bold text-white mb-2">Pin Bars and Reversal Patterns</h4>
                <p className="text-xs text-slate-400">Master identifying exhaustive wicks and high-probability reversal setups.</p>
              </div>
            </div>
          </div>

          {/* Certificates & Achievements */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Award size={18} className="text-accent-secondary" /> {t('rewards')}
            </h3>

            <div className="p-4 rounded-xl border border-accent-secondary/20 bg-accent-secondary/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-accent-secondary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-secondary/20 flex items-center justify-center shrink-0 border border-accent-secondary/30">
                  <BookOpen size={20} className="text-accent-secondary" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white mb-1">Market Fundamentals</h5>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">{t('issued')}: May 02, 2026</p>
                  <button className="text-[10px] font-bold text-accent-secondary hover:text-white transition-colors uppercase tracking-widest">
                    {t('viewCredential')}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 rounded-xl border border-white/5 bg-[#111] flex items-center justify-center min-h-[100px] text-center">
              <div>
                 <Lock size={16} className="mx-auto text-slate-600 mb-2" />
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('moreCoursesTitle', { defaultValue: 'Complete more courses to unlock certificates' })}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
