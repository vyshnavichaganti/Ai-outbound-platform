import React, { useState, useEffect } from 'react';
import { coursesService } from '../services/coursesService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { GraduationCap, Clock, DollarSign, Users, Award, CheckCircle, ArrowRight } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await coursesService.getCourses();
        setCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header Intro */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        padding: '24px 32px',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>AI Counselor Knowledge Base — Active Courses</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            These course curriculums, fees, and career paths are actively recommended by Priya AI during outbound call turns.
          </p>
        </div>
        <span className="badge-gold">{courses.length} Active Career Programs</span>
      </div>

      {/* Grid of Course Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {courses.map((course, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={22} />
                </div>
                {course.workshop_available && (
                  <span style={{ background: '#EAF7EE', color: '#1E7E34', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700' }}>
                    Live Workshop Available
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{course.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                {course.description || `Comprehensive ${course.duration} program designed for ${course.target || 'ambitious students'} seeking top placements.`}
              </p>

              {/* Specs pill list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Duration</span>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{course.duration}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Course Fee</span>
                  <p style={{ fontWeight: '700', color: 'var(--gold-dark)' }}>{course.fees}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Mode</span>
                  <p style={{ fontWeight: '700' }}>{course.mode || 'Online Live'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Target</span>
                  <p style={{ fontWeight: '700' }}>{course.target || 'B.Tech / Degree'}</p>
                </div>
              </div>

              {/* Career paths */}
              {course.career_paths && (
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Career Roles:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {course.career_paths.map((cp, i) => (
                      <span key={i} style={{ background: '#FFF', border: '1px solid var(--border-light)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} />
                <span>{course.students_interested || 340} Interested Leads</span>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                <span>View Syllabus</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
