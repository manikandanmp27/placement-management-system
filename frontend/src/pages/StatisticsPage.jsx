import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Percent,
  Building,
  RefreshCw,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  UserX,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { departmentsApi } from '../api/departments';
import { proceduresApi } from '../api/procedures';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

import MetricCard from '../components/common/MetricCard';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonMetricsGrid, SkeletonTable } from '../components/common/LoadingSkeleton';
import { formatPercentage } from '../utils/formatters';

const CHART_COLORS = {
  placed: '#10B981',
  unplaced: '#8C7B6E',
  primary: '#743F1D',
};

export function StatisticsPage() {
  const { isDark } = useTheme();
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  const [allDeptsStats, setAllDeptsStats] = useState([]);
  const [loadingAllStats, setLoadingAllStats] = useState(false);
  const [activeView, setActiveView] = useState('single'); // 'single' | 'compare'

  // Initial load: Fetch departments
  useEffect(() => {
    async function init() {
      try {
        setLoadingDepts(true);
        setError(null);
        const data = await departmentsApi.getAll();
        const deptList = Array.isArray(data) ? data : [];
        setDepartments(deptList);

        if (deptList.length > 0) {
          setSelectedDeptId(String(deptList[0].departmentId));
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError(err.message || 'Unable to connect to departments API.');
      } finally {
        setLoadingDepts(false);
      }
    }
    init();
  }, []);

  const fetchDeptStatistics = async (deptId) => {
    if (!deptId) return;
    try {
      setLoadingStats(true);
      setError(null);
      const result = await proceduresApi.getPlacementStatistics(Number(deptId));
      setStats(result);
    } catch (err) {
      console.error('Failed to execute PlacementStatistics procedure:', err);
      if (err.status === 404) {
        setStats({
          departmentName: departments.find((d) => String(d.departmentId) === String(deptId))?.departmentName || '',
          totalStudents: 0,
          studentsPlaced: 0,
          placementPercentage: 0,
        });
      } else {
        setError(err.message || 'Failed to execute procedure PlacementStatistics.');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId && activeView === 'single') {
      fetchDeptStatistics(selectedDeptId);
    }
  }, [selectedDeptId, activeView]);

  const loadAllDepartmentsStats = async () => {
    if (departments.length === 0) return;
    try {
      setLoadingAllStats(true);
      const results = await Promise.all(
        departments.map(async (d) => {
          try {
            const data = await proceduresApi.getPlacementStatistics(d.departmentId);
            return {
              departmentId: d.departmentId,
              departmentName: d.departmentName,
              totalStudents: data.totalStudents || 0,
              studentsPlaced: data.studentsPlaced || 0,
              placementPercentage: data.placementPercentage || 0,
            };
          } catch {
            return {
              departmentId: d.departmentId,
              departmentName: d.departmentName,
              totalStudents: 0,
              studentsPlaced: 0,
              placementPercentage: 0,
            };
          }
        })
      );
      // Sort descending by placementPercentage
      results.sort((a, b) => (b.placementPercentage || 0) - (a.placementPercentage || 0));
      setAllDeptsStats(results);
      setActiveView('compare');
    } catch (err) {
      console.error('Failed to compare all departments:', err);
      toast.error('Failed to load comparative statistics.');
    } finally {
      setLoadingAllStats(false);
    }
  };

  const handleRefresh = () => {
    if (activeView === 'single') {
      fetchDeptStatistics(selectedDeptId);
    } else {
      loadAllDepartmentsStats();
    }
    toast.success('Statistics refreshed from database.');
  };

  const pieData = useMemo(() => {
    if (!stats || stats.totalStudents === 0) return [];
    const placed = stats.studentsPlaced || 0;
    const unplaced = Math.max(0, stats.totalStudents - placed);
    return [
      { name: 'Placed Students', value: placed, color: CHART_COLORS.placed },
      { name: 'Unplaced Students', value: unplaced, color: CHART_COLORS.unplaced },
    ];
  }, [stats]);

  const tooltipBg = isDark ? '#201712' : '#FFFFFF';
  const tooltipBorder = isDark ? '#3D2D22' : '#DFD5C6';
  const tooltipText = isDark ? '#F8F3EC' : '#261C14';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Statistics</h1>
          <p className="page-subtitle">
            Placement statistics calculated via stored procedure <code>PlacementStatistics</code>; department drill-down and comparative analytics.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loadingStats || loadingAllStats}
            title="Refresh calculation"
          >
            <RefreshCw size={16} className={(loadingStats || loadingAllStats) ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Control Bar in Card */}
      <div
        className="card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        {/* Segmented View Control */}
        <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setActiveView('single')}
            style={{
              padding: '6px 14px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'single' ? 'var(--color-surface)' : 'transparent',
              color: activeView === 'single' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              boxShadow: activeView === 'single' ? 'var(--shadow-1)' : 'none',
              transition: 'all var(--duration-fast)',
            }}
          >
            Single Department
          </button>
          <button
            type="button"
            onClick={() => {
              if (allDeptsStats.length === 0) {
                loadAllDepartmentsStats();
              } else {
                setActiveView('compare');
              }
            }}
            style={{
              padding: '6px 14px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'compare' ? 'var(--color-surface)' : 'transparent',
              color: activeView === 'compare' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              boxShadow: activeView === 'compare' ? 'var(--shadow-1)' : 'none',
              transition: 'all var(--duration-fast)',
            }}
          >
            All Departments
          </button>
        </div>

        {/* Right side: Department picker (only in single view) */}
        {activeView === 'single' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <label htmlFor="select-dept-stats" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              Department:
            </label>
            <select
              id="select-dept-stats"
              className="form-select"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{ minWidth: '220px', maxWidth: '360px' }}
              aria-label="Select department to calculate statistics"
            >
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName} (ID: #{d.departmentId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {loadingDepts ? (
        <SkeletonMetricsGrid count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchDeptStatistics(selectedDeptId)} />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No Departments Available"
          description="Register departments to compute placement statistics."
        />
      ) : activeView === 'single' ? (
        /* ================= SINGLE DEPARTMENT VIEW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {loadingStats ? (
            <SkeletonMetricsGrid count={4} />
          ) : stats ? (
            <>
              {/* 4 Compact KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <MetricCard
                  title="Enrolled Students"
                  value={stats.totalStudents}
                  icon={Users}
                  variant="default"
                  subtitle={`${stats.departmentName || 'Department'} cohort`}
                />
                <MetricCard
                  title="Students Placed"
                  value={stats.studentsPlaced}
                  icon={Award}
                  variant="success"
                  subtitle="Verified recruitment offers"
                />
                <MetricCard
                  title="Unplaced Seeking"
                  value={Math.max(0, stats.totalStudents - stats.studentsPlaced)}
                  icon={UserX}
                  variant="warning"
                  subtitle="Actively seeking placement"
                />
                <MetricCard
                  title="Placement Rate"
                  value={formatPercentage(stats.placementPercentage)}
                  icon={Percent}
                  variant="success"
                  trend="Stored Procedure"
                  subtitle={`${stats.studentsPlaced} of ${stats.totalStudents} placed`}
                />
              </div>

              {/* Two-Up Grid: Donut Ratio & Summary List */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 'var(--space-6)',
                }}
              >
                {/* Donut Chart Card */}
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                      Placement Ratio
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                      Proportion of placed candidates vs unplaced cohort in {stats.departmentName}
                    </p>
                  </div>

                  {stats.totalStudents === 0 ? (
                    <EmptyState
                      title="No Enrolled Students"
                      description="No students are currently enrolled in this department."
                    />
                  ) : (
                    <div style={{ width: '100%', height: 260, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: tooltipBg,
                              borderColor: tooltipBorder,
                              borderRadius: '8px',
                              color: tooltipText,
                              boxShadow: 'var(--shadow-2)',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Stat Label */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatPercentage(stats.placementPercentage)}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Placed
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary List Card (spec: summary list replacing wrapping legend) */}
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                      Cohort Breakdown
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                      Verified figures returned from stored procedure execution
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {/* Summary row 1: Placed */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-4)',
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: CHART_COLORS.placed }} />
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          Placed Candidates
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', fontVariantNumeric: 'tabular-nums' }}>
                          {stats.studentsPlaced}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                          ({stats.totalStudents > 0 ? ((stats.studentsPlaced / stats.totalStudents) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>

                    {/* Summary row 2: Unplaced */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-4)',
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: CHART_COLORS.unplaced }} />
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          Unplaced / In Pipeline
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', fontVariantNumeric: 'tabular-nums' }}>
                          {Math.max(0, stats.totalStudents - stats.studentsPlaced)}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                          ({stats.totalStudents > 0 ? (((stats.totalStudents - stats.studentsPlaced) / stats.totalStudents) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>

                    {/* Procedure Details Box */}
                    <div
                      style={{
                        marginTop: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Procedure Signature:</span>
                        <code>CALL PlacementStatistics({selectedDeptId})</code>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Target Department:</span>
                        <span style={{ fontWeight: 600 }}>{stats.departmentName || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Calculation Timestamp:</span>
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        /* ================= ALL DEPARTMENTS COMPARATIVE VIEW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {loadingAllStats ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            <>
              {/* Horizontal Bar Chart Card */}
              <div className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                    Comparative Department Placement Rates
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                    Ranked by placement percentage (highest to lowest) across all academic units
                  </p>
                </div>

                <div style={{ width: '100%', height: Math.max(260, allDeptsStats.length * 48) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={allDeptsStats}
                      margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke={isDark ? '#A39282' : '#8C7B6E'}
                        fontSize={11}
                        unit="%"
                      />
                      <YAxis
                        type="category"
                        dataKey="departmentName"
                        stroke={isDark ? '#F8F3EC' : '#261C14'}
                        fontSize={12}
                        tickLine={false}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          borderColor: tooltipBorder,
                          borderRadius: '8px',
                          color: tooltipText,
                          boxShadow: 'var(--shadow-2)',
                        }}
                        formatter={(value) => [`${value}%`, 'Placement Rate']}
                      />
                      <Bar
                        dataKey="placementPercentage"
                        name="Placement %"
                        fill="var(--color-primary-600)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compact Summary Table Below Bar Chart */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Dept ID</th>
                        <th style={{ minWidth: '220px' }}>Department</th>
                        <th className="col-numeric" style={{ width: '120px', textAlign: 'right' }}>Enrolled</th>
                        <th className="col-numeric" style={{ width: '120px', textAlign: 'right' }}>Placed</th>
                        <th className="col-numeric" style={{ width: '150px', textAlign: 'right' }}>Placement Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDeptsStats.map((d) => (
                        <tr key={d.departmentId}>
                          <td style={{ width: '90px', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            #{d.departmentId}
                          </td>
                          <td style={{ minWidth: '220px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {d.departmentName}
                          </td>
                          <td className="col-numeric" style={{ width: '120px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {d.totalStudents}
                          </td>
                          <td className="col-numeric" style={{ width: '120px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--color-success)' }}>
                            {d.studentsPlaced}
                          </td>
                          <td className="col-numeric" style={{ width: '150px', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                backgroundColor: d.placementPercentage >= 75 ? 'var(--color-success-bg)' : 'var(--color-surface-hover)',
                                color: d.placementPercentage >= 75 ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                                border: d.placementPercentage >= 75 ? '1px solid var(--color-success-border)' : '1px solid var(--color-border)',
                              }}
                            >
                              {formatPercentage(d.placementPercentage)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StatisticsPage;
