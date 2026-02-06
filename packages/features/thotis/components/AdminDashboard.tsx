import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Card, Table } from "@calcom/ui";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateCSV } from "./AdminDashboardUtils";

// --- Types & Interfaces ---
// Moved to AdminDashboardUtils.ts

// --- Utilities ---
// Moved to AdminDashboardUtils.ts

// --- Sub-Components ---

const StatsOverview = ({ stats }: { stats: Record<string, any> }) => {
  const { t } = useLocale();

  const completionRate = stats?._sum?.totalSessions
    ? Math.round(((stats._sum.completedSessions || 0) / stats._sum.totalSessions) * 100)
    : 0;

  const cards = [
    {
      label: t("thotis_total_mentors"),
      value: stats?._count?.id || 0,
    },
    {
      label: t("thotis_total_sessions"),
      value: stats?._sum?.totalSessions || 0,
    },
    {
      label: t("thotis_completion_rate"),
      value: `${completionRate}%`,
    },
    {
      label: t("thotis_avg_platform_rating"),
      value: stats?._avg?.averageRating?.toFixed(1) || "N/A",
    },
  ];

  return (
    <div className="space-y-4">
      {stats?.dataQuality?.issues?.length > 0 && (
        <div className="bg-error-subtle text-error p-3 rounded-md border border-error flex items-center gap-2 text-sm">
          <span>⚠️</span>
          <div>
            <strong>{t("thotis_data_quality_warning")}:</strong>
            <ul className="list-disc ml-5">
              {stats.dataQuality.issues.map((issue: string, i: number) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <Card key={idx} className="p-4">
            <p className="text-subtle text-sm font-medium">{card.label}</p>
            <p className="text-emphasis mt-2 text-2xl font-bold">{card.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SessionTrendsChart = ({ trends }: { trends: Record<string, any> }) => {
  const { t } = useLocale();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const rawData = trends?.[period] || [];
  const data = rawData.map((d: any) => ({
    date:
      period === "daily"
        ? new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : d.date,
    count: d.count,
  }));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emphasis text-lg font-semibold">{t(`thotis_session_trends_${period}`)}</h3>
        <div className="flex gap-1 bg-subtle p-1 rounded-md">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              color={period === p ? "primary" : "minimal"}
              onClick={() => setPeriod(p)}
              className="px-2 py-1 text-xs">
              {t(`thotis_period_${p}`)}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#292929"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const FunnelChart = ({ funnel }: { funnel: Record<string, any> }) => {
  const { t } = useLocale();
  const data = [
    { name: t("thotis_funnel_viewed"), count: funnel?.counts?.profile_viewed || 0 },
    { name: t("thotis_funnel_started"), count: funnel?.counts?.booking_started || 0 },
    { name: t("thotis_funnel_confirmed"), count: funnel?.counts?.booking_confirmed || 0 },
    { name: t("thotis_funnel_completed"), count: funnel?.counts?.session_completed || 0 },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-emphasis mb-4 text-lg font-semibold">{t("thotis_conversion_funnel")}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#292929" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-subtle rounded-md">
          <p className="text-subtle font-medium">{t("thotis_conv_started")}</p>
          <p className="text-emphasis font-bold">
            {funnel?.conversion?.profile_to_booking_started?.toFixed(1)}%
          </p>
        </div>
        <div className="p-2 bg-subtle rounded-md">
          <p className="text-subtle font-medium">{t("thotis_conv_confirmed")}</p>
          <p className="text-emphasis font-bold">
            {funnel?.conversion?.booking_started_to_confirmed?.toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  );
};

const FieldDistributionChart = ({ distribution }: { distribution: Record<string, any> }) => {
  const { t } = useLocale();
  const data =
    distribution?.fieldDistribution?.map((d: any) => ({
      name: d.field,
      value: d._count.id,
    })) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <Card className="p-4">
      <h3 className="text-emphasis mb-4 text-lg font-semibold">{t("thotis_field_distribution")}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const MentorList = ({ profiles }: { profiles: any[] }) => {
  const { t } = useLocale();
  const columns = [
    { Header: t("thotis_header_university"), accessor: "university" },
    { Header: t("thotis_header_field"), accessor: "field" },
    { Header: t("thotis_header_sessions"), accessor: "totalSessions" },
    { Header: t("thotis_header_rating"), accessor: "averageRating" },
    {
      Header: t("thotis_header_completion"),
      accessor: (row: any) => {
        const rate =
          row.totalSessions > 0 ? Math.round((row.completedSessions / row.totalSessions) * 100) : 0;
        return `${rate}%`;
      },
    },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emphasis text-lg font-semibold">{t("thotis_mentor_performance")}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              {columns.map((col, idx) => (
                <Table.Head key={idx}>{col.Header}</Table.Head>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {profiles.map((profile: any) => (
              <Table.Row key={profile.id}>
                <Table.Cell>{profile.university}</Table.Cell>
                <Table.Cell>{profile.field}</Table.Cell>
                <Table.Cell>{profile.totalSessions}</Table.Cell>
                <Table.Cell>{profile.averageRating?.toFixed(1) || "-"}</Table.Cell>
                <Table.Cell>
                  {profile.totalSessions > 0
                    ? Math.round((profile.completedSessions / profile.totalSessions) * 100) + "%"
                    : "0%"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Card>
  );
};

const RecentIncidents = () => {
  const { t } = useLocale();
  const { data: incidentsData, isLoading } = trpc.thotis.admin.listIncidents.useQuery({
    page: 1,
    pageSize: 5,
    resolved: false,
  });

  if (isLoading) return <Card className="p-4">Loading incidents...</Card>;

  const incidents = incidentsData?.incidents || [];

  return (
    <Card className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emphasis text-lg font-semibold">{t("thotis_recent_incidents")}</h3>
        <Button
          variant="minimal"
          size="sm"
          color="secondary"
          href="/thotis/admin/incidents"
          className="text-xs">
          {t("thotis_view_all")}
        </Button>
      </div>
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <p className="text-subtle text-sm text-center py-8">{t("thotis_no_recent_incidents")}</p>
        ) : (
          incidents.map((incident: any) => (
            <div key={incident.id} className="p-3 bg-subtle rounded-md border border-subtle">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emphasis">
                  {incident.type}
                </span>
                <span className="text-[10px] text-muted">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-default line-clamp-2 mb-2 italic">
                "{incident.description || t("thotis_no_description")}"
              </p>
              <div className="text-[10px] text-muted flex justify-between">
                <span>{incident.studentProfile?.university}</span>
                <span className="font-medium text-emphasis">{incident.studentProfile?.user?.name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

import { AmbassadorManagement } from "./AmbassadorManagement";

// --- Main Component ---

export const AdminDashboard = () => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"insights" | "ambassadors">("insights");
  const { data: stats, isLoading: isLoadingStats } = trpc.thotis.statistics.platformStats.useQuery();
  const { data: searchData, isLoading: isLoadingProfiles } = trpc.thotis.profile.search.useQuery({
    page: 1,
    pageSize: 50,
  });

  const handleExportCSV = () => {
    if (!searchData?.profiles) return;

    const csvContent = "data:text/csv;charset=utf-8," + generateCSV(searchData.profiles as any);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "thotis_platform_stats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingStats || isLoadingProfiles) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-emphasis text-2xl font-bold">{t("thotis_admin_dashboard")}</h1>
        <div className="flex gap-2">
          <Button
            color={activeTab === "insights" ? "primary" : "minimal"}
            onClick={() => setActiveTab("insights")}>
            {t("thotis_tab_insights")}
          </Button>
          <Button
            color={activeTab === "ambassadors" ? "primary" : "minimal"}
            onClick={() => setActiveTab("ambassadors")}>
            {t("thotis_tab_ambassadors")}
          </Button>
          <div className="ml-4 border-l pl-4">
            <Button color="secondary" onClick={handleExportCSV}>
              {t("thotis_export_csv")}
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "insights" ? (
        <>
          <StatsOverview stats={stats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SessionTrendsChart trends={stats?.trends} />
            <RecentIncidents />
            <FunnelChart funnel={stats?.funnel} />
            <FieldDistributionChart distribution={stats} />
          </div>

          <MentorList profiles={searchData?.profiles || []} />
        </>
      ) : (
        <AmbassadorManagement />
      )}
    </div>
  );
};

export default AdminDashboard;
