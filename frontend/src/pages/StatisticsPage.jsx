import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Percent,
  Building,
  RefreshCw,
  PieChart as PieChartIcon,
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
  Legend,
} from 'recharts';

import { departmentsApi } from '../api/departments';
import { proceduresApi } from '../api/procedures';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

import MetricCard from '../components/common/MetricCard';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';
import { formatPercentage } from '../utils/formatters';

const PIE_COLORS = ['#10B981', '#64748B'];

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
  const [activeView, setActiveView] = useState('single'); 

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
    if (selectedDeptId) {
      fetchDeptStatistics(selectedDeptId);
    }
  }, [selectedDeptId]);

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
      setAllDeptsStats(results);
      setActiveView('compare');
    } catch (err) {
      console.error('Failed to compare all departments:', err);
      toast.error('Failed to load comparative statistics.');
    } finally {
      setLoadingAllStats(false);
    }
  };

  const pieData = React.useMemo(() => {
    if (!stats || stats.totalStudents === 0) return [];
    const placed = stats.studentsPlaced || 0;
    const unplaced = Math.max(0, stats.totalStudents - placed);
    return [
      { name: 'Placed Students', value: placed },
      { name: 'Unplaced Students', value: unplaced },
    ];
  }, [stats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Placement Statistics & Analytics
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Data directly calculated via MySQL Stored Procedure <code>PlacementStatistics(departmentId)</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={activeView === 'single' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveView('single')}
          >
            Single Department
          </Button>
          <Button
            variant={activeView === 'compare' ? 'primary' : 'secondary'}
            size="sm"
            onClick={loadAllDepartmentsStats}
            isLoading={loadingAllStats}
          >
            Comparative View
          </Button>
        </div>
      </div>

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
        <>
          
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 260 }}>
              <label htmlFor="select-department-stats" style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                Select Department:
              </label>
              <select
                id="select-department-stats"
                className="form-select"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                style={{ maxWidth: 380 }}
              >
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName} (ID: #{d.departmentId})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchDeptStatistics(selectedDeptId)}
              isLoading={loadingStats}
            >
              Refresh Procedure
            </Button>
          </div>

          {loadingStats ? (
            <SkeletonMetricsGrid count={4} />
          ) : stats ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <MetricCard
                  title="Department Name"
                  value={stats.departmentName || '—'}
                  icon={Building}
                  variant="default"
                  subtitle={`Department ID: #${selectedDeptId}`}
                />
                <MetricCard
                  title="Total Students"
                  value={stats.totalStudents}
                  icon={Users}
                  variant="info"
                  subtitle="Enrolled cohort in department"
                />
                <MetricCard
                  title="Students Placed"
                  value={stats.studentsPlaced}
                  icon={Award}
                  variant="success"
                  subtitle="Verified recruitment offers"
                />
                <MetricCard
                  title="Placement Percentage"
                  value={formatPercentage(stats.placementPercentage)}
                  icon={Percent}
                  variant="success"
                  trend="Calculated by SP"
                  subtitle={`${stats.studentsPlaced} of ${stats.totalStudents} placed`}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                
                <Card>
                  <CardHeader
                    title="Placement Ratio"
                    subtitle="Placed candidates vs seeking placement"
                  />
                  <CardBody>
                    {stats.totalStudents === 0 ? (
                      <EmptyState
                        title="No Enrolled Students"
                        description="There are currently no students registered under this department."
                      />
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={4}
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#151F32' : '#FFFFFF',
                                borderColor: isDark ? '#2A3850' : '#E4E8F0',
                                borderRadius: '8px',
                                color: isDark ? '#F1F5F9' : '#172033',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              }}
                            />
                            <Legend
                              formatter={(val) => (
                                <span style={{ color: isDark ? '#A5B4C7' : '#667085', fontSize: '0.785rem' }}>
                                  {val}
                                </span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Stored Procedure Output"
                    subtitle="Exact returned record from CALL PlacementStatistics"
                  />
                  <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Attribute</th>
                          <th>Database Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>department_name</td>
                          <td>{stats.departmentName || '—'}</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>total_students</td>
                          <td>
                            <strong>{stats.totalStudents}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>students_placed</td>
                          <td>
                            <strong style={{ color: 'var(--color-success)' }}>
                              {stats.studentsPlaced}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>placement_percentage</td>
                          <td>
                            <span
                              className="badge badge-success"
                              style={{ fontSize: '0.85rem' }}
                            >
                              {formatPercentage(stats.placementPercentage)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          ) : null}
        </>
      ) : (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader
              title="Comparative Department Placement Rates"
              subtitle="Comparison across all academic departments"
            />
            <CardBody>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allDeptsStats} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
                    <XAxis
                      dataKey="departmentName"
                      stroke={isDark ? '#A5B4C7' : '#667085'}
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke={isDark ? '#A5B4C7' : '#667085'}
                      fontSize={12}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#151F32' : '#FFFFFF',
                        borderColor: isDark ? '#2A3850' : '#E4E8F0',
                        borderRadius: '8px',
                        color: isDark ? '#F1F5F9' : '#172033',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      formatter={(value) => [`${value}%`, 'Placement Rate']}
                    />
                    <Bar
                      dataKey="placementPercentage"
                      name="Placement %"
                      fill="#3B5BDB"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department ID</th>
                    <th>Department Name</th>
                    <th>Total Students</th>
                    <th>Placed</th>
                    <th>Placement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {allDeptsStats.map((d) => (
                    <tr key={d.departmentId}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                        #{d.departmentId}
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.departmentName}</td>
                      <td>{d.totalStudents}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                        {d.studentsPlaced}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {formatPercentage(d.placementPercentage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsPage;
