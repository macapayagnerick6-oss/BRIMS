import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../../services/data.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

type ReportPeriod = 'all' | 'last_15_days' | 'this_month' | 'this_semester' | 'this_year';
type ReportFormat = 'pdf' | 'excel';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  activeTab: string = 'residents';
  reportPeriod: ReportPeriod = 'all';
  reportFormat: ReportFormat = 'pdf';

  private subscriptions = new Subscription();

  // Chart data objects are kept as fields so they
  // don't get recreated on every change detection cycle.
  public residentPurokBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public ageGroupLineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public householdPurokBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public requestTypeBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  constructor(
    public data: DataService,
    private alerts: AlertService,
  ) {}

  ngOnInit(): void {
    // Initial build in case data is already loaded
    this.updateResidentCharts();
    this.updateHouseholdCharts();
    this.updateRequestCharts();

    // Rebuild chart data only when underlying data actually changes
    this.subscriptions.add(
      this.data.residentsObservable.subscribe(() => {
        this.updateResidentCharts();
      }),
    );

    this.subscriptions.add(
      this.data.householdsObservable.subscribe(() => {
        this.updateHouseholdCharts();
      }),
    );

    this.subscriptions.add(
      this.data.requestsObservable.subscribe(() => {
        this.updateRequestCharts();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Shared chart options
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Resident Statistics
  getResidentStats() {
    // Only include active (non-archived) residents in reports
    const residents = this.data.getActiveResidents();
    const total = residents.length;
    const male = residents.filter(r => r.gender === 'Male').length;
    const female = residents.filter(r => r.gender === 'Female').length;
    const senior = residents.filter(r => r.age >= 60).length;
    const adult = residents.filter(r => r.age >= 18 && r.age < 60).length;
    const minor = residents.filter(r => r.age < 18).length;

    // Purok distribution
    const purokCounts: { [key: string]: number } = {};
    residents.forEach(r => {
      purokCounts[r.purok] = (purokCounts[r.purok] || 0) + 1;
    });

    return {
      total,
      male,
      female,
      senior,
      adult,
      minor,
      purokCounts
    };
  }

  getResidentPuroks() {
    const stats = this.getResidentStats();
    return Object.keys(stats.purokCounts).map(purok => ({
      name: purok,
      count: stats.purokCounts[purok],
      percentage: (stats.purokCounts[purok] / stats.total * 100).toFixed(1)
    }));
  }

  // Household Statistics
  getHouseholdStats() {
    // Only include active (non-archived) households in reports
    const households = this.data.getActiveHouseholds();
    const total = households.length;
    const totalMembers = households.reduce((sum, h) => sum + h.members.length, 0);
    const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : 0;

    // Purok distribution
    const purokCounts: { [key: string]: number } = {};
    households.forEach(h => {
      purokCounts[h.purok] = (purokCounts[h.purok] || 0) + 1;
    });

    return {
      total,
      totalMembers,
      avgMembers,
      purokCounts
    };
  }

  getHouseholdPuroks() {
    const stats = this.getHouseholdStats();
    return Object.keys(stats.purokCounts).map(purok => ({
      name: purok,
      count: stats.purokCounts[purok],
      percentage: (stats.purokCounts[purok] / stats.total * 100).toFixed(1)
    }));
  }

  // Certificate Request Statistics
  getRequestStats() {
    // Only include active (non-archived) requests in reports,
    // filtered by the selected reporting period.
    const requests = this.getRequestsForReports();
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const forReview = requests.filter(r => r.status === 'For Review').length;

    // Type distribution
    const typeCounts: { [key: string]: number } = {};
    requests.forEach(r => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    return {
      total,
      approved,
      pending,
      forReview,
      typeCounts
    };
  }

  getRequestTypes() {
    const stats = this.getRequestStats();
    return Object.keys(stats.typeCounts).map(type => ({
      name: type,
      count: stats.typeCounts[type],
      percentage: (stats.typeCounts[type] / stats.total * 100).toFixed(1)
    }));
  }

  // Build / refresh chart data for residents tab
  private updateResidentCharts(): void {
    const puroks = this.getResidentPuroks();
    this.residentPurokBarData = {
      labels: puroks.map(p => p.name),
      datasets: [
        {
          data: puroks.map(p => p.count),
          label: 'Residents',
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
      ],
    };

    const stats = this.getResidentStats();
    const labels = ['Minors (<18)', 'Adults (18-59)', 'Senior Citizens (60+)'];
    const values = [stats.minor, stats.adult, stats.senior];

    this.ageGroupLineData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Age Groups',
          fill: false,
          tension: 0.3,
          borderColor: '#6366f1',
          backgroundColor: '#6366f1',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6366f1',
          pointRadius: 4,
        },
      ],
    };
  }

  // Build / refresh chart data for households tab
  private updateHouseholdCharts(): void {
    const puroks = this.getHouseholdPuroks();
    this.householdPurokBarData = {
      labels: puroks.map(p => p.name),
      datasets: [
        {
          data: puroks.map(p => p.count),
          label: 'Households',
          backgroundColor: '#22c55e',
          borderRadius: 6,
        },
      ],
    };
  }

  // Build / refresh chart data for requests tab
  private updateRequestCharts(): void {
    const types = this.getRequestTypes();
    this.requestTypeBarData = {
      labels: types.map(t => t.name),
      datasets: [
        {
          data: types.map(t => t.count),
          label: 'Requests',
          backgroundColor: '#f97316',
          borderRadius: 6,
        },
      ],
    };
  }

  // Date + period helpers for request-based reports
  private parseDate(value: string | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  getRequestsForReports() {
    const all = this.data.getActiveRequests();
    if (this.reportPeriod === 'all') {
      return all;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const todayMidnight = new Date(currentYear, currentMonth, today.getDate());
    const dayMs = 24 * 60 * 60 * 1000;

    return all.filter(req => {
      const parsed = this.parseDate(req.date);
      if (!parsed) return false;
      const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

      switch (this.reportPeriod) {
        case 'last_15_days': {
          const threshold = new Date(todayMidnight.getTime() - 14 * dayMs);
          return d >= threshold && d <= todayMidnight;
        }
        case 'this_month':
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        case 'this_semester': {
          const semesterStartMonth = currentMonth < 6 ? 0 : 6;
          const semesterEndMonth = currentMonth < 6 ? 5 : 11;
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() >= semesterStartMonth &&
            d.getMonth() <= semesterEndMonth
          );
        }
        case 'this_year':
          return d.getFullYear() === currentYear;
        default:
          return true;
      }
    });
  }

  onReportPeriodChange() {
    this.updateRequestCharts();
  }

  private getPeriodLabel(): string {
    switch (this.reportPeriod) {
      case 'last_15_days':
        return 'last_15_days';
      case 'this_month':
        return 'this_month';
      case 'this_semester':
        return 'this_semester';
      case 'this_year':
        return 'this_year';
      default:
        return 'all';
    }
  }

  private getReadablePeriodLabel(): string {
    switch (this.reportPeriod) {
      case 'last_15_days':
        return 'Last 15 days';
      case 'this_month':
        return 'This month';
      case 'this_semester':
        return 'This semester';
      case 'this_year':
        return 'This year';
      default:
        return 'All time';
    }
  }

  async exportReports(): Promise<void> {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      const result = await Swal.fire<{
        period: ReportPeriod;
        format: ReportFormat;
      }>({
        title: 'Export reports',
        html: `
          <div class="form-group" style="text-align:left;margin-top:8px;">
            <label for="swal-report-period">Report period</label>
            <select id="swal-report-period" class="form-control">
              <option value="all"${this.reportPeriod === 'all' ? ' selected' : ''}>All</option>
              <option value="last_15_days"${this.reportPeriod === 'last_15_days' ? ' selected' : ''}>Last 15 days</option>
              <option value="this_month"${this.reportPeriod === 'this_month' ? ' selected' : ''}>This month</option>
              <option value="this_semester"${this.reportPeriod === 'this_semester' ? ' selected' : ''}>This semester</option>
              <option value="this_year"${this.reportPeriod === 'this_year' ? ' selected' : ''}>This year</option>
            </select>
          </div>
          <div class="form-group" style="text-align:left;margin-top:10px;">
            <label>Format</label>
            <div style="display:flex;gap:0.75rem;margin-top:6px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:0.9rem;">
                <input type="radio" name="swal-report-format" value="pdf" ${this.reportFormat === 'pdf' ? 'checked' : ''}/>
                <span>PDF</span>
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:0.9rem;">
                <input type="radio" name="swal-report-format" value="excel" ${this.reportFormat === 'excel' ? 'checked' : ''}/>
                <span>Excel (CSV)</span>
              </label>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Export',
        cancelButtonText: 'Cancel',
        icon: 'question',
        preConfirm: () => {
          const periodSelect = document.getElementById(
            'swal-report-period',
          ) as HTMLSelectElement | null;
          const checkedFormat = document.querySelector(
            'input[name="swal-report-format"]:checked',
          ) as HTMLInputElement | null;

          if (!periodSelect || !checkedFormat) {
            Swal.showValidationMessage('Please choose period and format.');
            return;
          }

          return {
            period: periodSelect.value as ReportPeriod,
            format: checkedFormat.value as ReportFormat,
          };
        },
      });

      if (result.isConfirmed && result.value) {
        this.reportPeriod = result.value.period;
        this.reportFormat = result.value.format;

        // Rebuild charts that depend on the period
        this.updateRequestCharts();

        if (this.reportFormat === 'pdf') {
          this.exportPdf();
        } else {
          this.exportCsv();
        }
      }

      return;
    }

    const result = await this.alerts.confirm({
      title: 'Choose export format',
      text: 'Export reports as PDF or Excel (CSV)?',
      confirmButtonText: 'PDF',
      cancelButtonText: 'Excel (CSV)',
      icon: 'question',
    });

    if (result.isConfirmed) {
      this.reportFormat = 'pdf';
      this.exportPdf();
    } else if (result.dismiss === 'cancel') {
      this.reportFormat = 'excel';
      this.exportCsv();
    }
  }

  private exportPdf(): void {
    const label = this.getPeriodLabel();
    const residentStats = this.getResidentStats();
    const householdStats = this.getHouseholdStats();
    const demographicPuroks = this.getDemographicPuroks();
    const requestStats = this.getRequestStats();
    const requests = this.getRequestsForReports();

    const doc = new jsPDF('portrait', 'mm', 'a4');
    let y = 16;

    // Header
    doc.setFontSize(14);
    doc.text('BRIMS Barangay Reports', 14, y);
    y += 7;

    doc.setFontSize(11);
    doc.text(`Reporting period: ${this.getReadablePeriodLabel()}`, 14, y);
    y += 6;

    const generatedOn = new Date();
    doc.setFontSize(9);
    doc.text(`Generated on: ${generatedOn.toLocaleDateString()}`, 14, y);
    y += 10;

    // --- Section 1: Resident Statistics ---
    doc.setFontSize(12);
    doc.text('Resident Statistics', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.text(`Total residents: ${residentStats.total}`, 14, y);
    y += 5;
    doc.text(`Male: ${residentStats.male}    Female: ${residentStats.female}`, 14, y);
    y += 5;
    doc.text(
      `Minors (<18): ${residentStats.minor}    Adults (18-59): ${residentStats.adult}    Seniors (60+): ${residentStats.senior}`,
      14,
      y,
    );
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Purok', 14, y);
    doc.text('Residents', 60, y);
    doc.text('%', 100, y);
    y += 5;
    doc.setFont('helvetica', 'normal');

    this.getResidentPuroks().forEach(p => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Purok', 14, y);
        doc.text('Residents', 60, y);
        doc.text('%', 100, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
      }
      doc.text(p.name, 14, y);
      doc.text(String(p.count), 60, y);
      doc.text(`${p.percentage}%`, 100, y);
      y += 5;
    });

    // --- Section 2: Household Statistics ---
    if (y > 260) {
      doc.addPage();
      y = 20;
    } else {
      y += 8;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Household Statistics', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total households: ${householdStats.total}`, 14, y);
    y += 5;
    doc.text(`Total members: ${householdStats.totalMembers}`, 14, y);
    y += 5;
    doc.text(`Average members/household: ${householdStats.avgMembers}`, 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Purok', 14, y);
    doc.text('Households', 60, y);
    doc.text('%', 100, y);
    y += 5;
    doc.setFont('helvetica', 'normal');

    this.getHouseholdPuroks().forEach(p => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Purok', 14, y);
        doc.text('Households', 60, y);
        doc.text('%', 100, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
      }
      doc.text(p.name, 14, y);
      doc.text(String(p.count), 60, y);
      doc.text(`${p.percentage}%`, 100, y);
      y += 5;
    });

    // --- Section 3: Demographics Overview ---
    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      y += 8;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Demographics Overview', 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Purok', 14, y);
    doc.text('Residents', 50, y);
    doc.text('Households', 90, y);
    doc.text('Avg members/HH', 140, y);
    y += 5;
    doc.setFont('helvetica', 'normal');

    demographicPuroks.forEach(p => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Purok', 14, y);
        doc.text('Residents', 50, y);
        doc.text('Households', 90, y);
        doc.text('Avg members/HH', 140, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
      }
      doc.text(p.name, 14, y);
      doc.text(String(p.residents), 50, y);
      doc.text(String(p.households), 90, y);
      doc.text(String(p.avgMembers), 140, y);
      y += 5;
    });

    // --- Section 4: Certificate Requests ---
    doc.addPage();
    y = 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate Requests', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Total: ${requestStats.total}   Approved: ${requestStats.approved}   Pending: ${requestStats.pending}   For Review: ${requestStats.forReview}`,
      14,
      y,
    );
    y += 8;

    const colX = { date: 14, type: 40, purpose: 90, status: 170 };
    const rowHeight = 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', colX.date, y);
    doc.text('Type', colX.type, y);
    doc.text('Purpose', colX.purpose, y);
    doc.text('Status', colX.status, y);
    y += rowHeight;
    doc.setFont('helvetica', 'normal');

    requests.forEach(req => {
      if (y > 280) {
        doc.addPage();
        y = 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Date', colX.date, y);
        doc.text('Type', colX.type, y);
        doc.text('Purpose', colX.purpose, y);
        doc.text('Status', colX.status, y);
        y += rowHeight;
        doc.setFont('helvetica', 'normal');
      }

      const date = req.date || '';
      const type = req.type || '';
      const purpose = req.purpose || '';
      const status = req.status || '';

      const purposeText = purpose.length > 40 ? `${purpose.slice(0, 37)}...` : purpose;

      doc.text(date, colX.date, y);
      doc.text(type, colX.type, y);
      doc.text(purposeText, colX.purpose, y);
      doc.text(status, colX.status, y);

      y += rowHeight;
    });

    doc.save(`BRIMS_reports_${label}.pdf`);
  }

  private csvRow(...cols: (string | number)[]): string {
    return cols
      .map(col => {
        const value = String(col ?? '');
        if (/[",\n]/.test(value)) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  }

  private exportCsv(): void {
    const label = this.getPeriodLabel();
    const residentStats = this.getResidentStats();
    const householdStats = this.getHouseholdStats();
    const demographicPuroks = this.getDemographicPuroks();
    const requestStats = this.getRequestStats();
    const requests = this.getRequestsForReports();

    const lines: string[] = [];

    // Header
    lines.push(this.csvRow('BRIMS Barangay Reports'));
    lines.push(this.csvRow(`Reporting period: ${this.getReadablePeriodLabel()}`));
    lines.push(this.csvRow(`Generated on: ${new Date().toLocaleDateString()}`));
    lines.push('');

    // Resident statistics
    lines.push(this.csvRow('Resident Statistics'));
    lines.push(this.csvRow('Total residents', residentStats.total));
    lines.push(this.csvRow('Male', residentStats.male));
    lines.push(this.csvRow('Female', residentStats.female));
    lines.push(this.csvRow('Minors (<18)', residentStats.minor));
    lines.push(this.csvRow('Adults (18-59)', residentStats.adult));
    lines.push(this.csvRow('Seniors (60+)', residentStats.senior));
    lines.push('');

    lines.push(this.csvRow('Purok', 'Residents', 'Percentage'));
    this.getResidentPuroks().forEach(p => {
      lines.push(this.csvRow(p.name, p.count, `${p.percentage}%`));
    });
    lines.push('');

    // Household statistics
    lines.push(this.csvRow('Household Statistics'));
    lines.push(this.csvRow('Total households', householdStats.total));
    lines.push(this.csvRow('Total members', householdStats.totalMembers));
    lines.push(this.csvRow('Average members/household', householdStats.avgMembers));
    lines.push('');

    lines.push(this.csvRow('Purok', 'Households', 'Percentage'));
    this.getHouseholdPuroks().forEach(p => {
      lines.push(this.csvRow(p.name, p.count, `${p.percentage}%`));
    });
    lines.push('');

    // Demographics
    lines.push(this.csvRow('Demographics Overview'));
    lines.push(this.csvRow('Purok', 'Residents', 'Households', 'Avg members/HH'));
    demographicPuroks.forEach(p => {
      lines.push(this.csvRow(p.name, p.residents, p.households, p.avgMembers));
    });
    lines.push('');

    // Certificate requests
    lines.push(this.csvRow('Certificate Requests'));
    lines.push(
      this.csvRow(
        'Total',
        requestStats.total,
        'Approved',
        requestStats.approved,
        'Pending',
        requestStats.pending,
        'For Review',
        requestStats.forReview,
      ),
    );
    lines.push('');

    lines.push(this.csvRow('Date', 'Type', 'Purpose', 'Status'));
    requests.forEach(req => {
      lines.push(
        this.csvRow(
          req.date || '',
          req.type || '',
          req.purpose || '',
          req.status || '',
        ),
      );
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BRIMS_reports_${label}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getDemographicPuroks() {
    const residentStats = this.getResidentStats();
    const householdStats = this.getHouseholdStats();
    const puroks = new Set([...Object.keys(residentStats.purokCounts), ...Object.keys(householdStats.purokCounts)]);
    
    return Array.from(puroks).map(purok => ({
      name: purok,
      residents: residentStats.purokCounts[purok] || 0,
      households: householdStats.purokCounts[purok] || 0,
      avgMembers: householdStats.purokCounts[purok] 
        ? ((residentStats.purokCounts[purok] || 0) / householdStats.purokCounts[purok]).toFixed(1)
        : '-'
    }));
  }
}
