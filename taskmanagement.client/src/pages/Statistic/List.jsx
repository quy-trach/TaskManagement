import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import LayoutMain from '../../layouts/LayoutMain';

const List = () => {
    return (
        <>
            <title>Thống kê công việc</title>
            <LayoutMain pageTitle="Thống kê công việc">
                <Breadcrumb />
                <main className="stats-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card pending">
                            <div className="stat-icon">
                                <i className="ri-time-line"></i>
                            </div>
                            <div className="stat-value">24</div>
                            <div className="stat-label">Chưa bắt đầu</div>
                        </div>

                        <div className="stat-card in-progress">
                            <div className="stat-icon">
                                <i className="ri-loader-2-line"></i>
                            </div>
                            <div className="stat-value">18</div>
                            <div className="stat-label">Đang thực hiện</div>
                        </div>

                        <div className="stat-card completed">
                            <div className="stat-icon">
                                <i className="ri-checkbox-circle-line"></i>
                            </div>
                            <div className="stat-value">42</div>
                            <div className="stat-label">Hoàn thành</div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="charts-section">
                        <div className="chart-container">
                            <h3 className="chart-title">Biểu đồ tròn trạng thái công việc</h3>
                            <div className="chart-wrapper">
                                <canvas id="statusChart"></canvas>
                            </div>
                        </div>

                        <div className="chart-container">
                            <h3 className="chart-title">Biểu đồ cột theo phòng ban</h3>
                            <div className="chart-wrapper">
                                <canvas id="departmentChart"></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Department Statistics Table */}
                    <div className="department-stats">
                        <div className="department-stats-header">
                            <h2>Thống kê theo phòng ban</h2>
                            <p>Chi tiết số lượng công việc theo từng phòng ban</p>
                        </div>

                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Phòng ban</th>
                                    <th>Chưa bắt đầu</th>
                                    <th>Đang thực hiện</th>
                                    <th>Hoàn thành</th>
                                    <th>Tổng cộng</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="department-name">Phòng IT</td>
                                    <td><span className="status-number status-pending">8</span></td>
                                    <td><span className="status-number status-progress">6</span></td>
                                    <td><span className="status-number status-completed">15</span></td>
                                    <td><span className="status-number status-overdue">2</span></td>
                                    <td className="total-tasks">31</td>
                                </tr>
                                <tr>
                                    <td className="department-name">Phòng Marketing</td>
                                    <td><span className="status-number status-pending">5</span></td>
                                    <td><span className="status-number status-progress">4</span></td>
                                    <td><span className="status-number status-completed">12</span></td>
                                    <td><span className="status-number status-overdue">3</span></td>
                                    <td className="total-tasks">24</td>
                                </tr>
                                <tr>
                                    <td className="department-name">Phòng Kế toán</td>
                                    <td><span className="status-number status-pending">3</span></td>
                                    <td><span className="status-number status-progress">2</span></td>
                                    <td><span className="status-number status-completed">8</span></td>
                                    <td><span className="status-number status-overdue">1</span></td>
                                    <td className="total-tasks">14</td>
                                </tr>
                                <tr>
                                    <td className="department-name">Phòng Nhân sự</td>
                                    <td><span className="status-number status-pending">4</span></td>
                                    <td><span className="status-number status-progress">3</span></td>
                                    <td><span className="status-number status-completed">5</span></td>
                                    <td><span className="status-number status-overdue">1</span></td>
                                    <td className="total-tasks">13</td>
                                </tr>
                                <tr>
                                    <td className="department-name">Phòng Kinh doanh</td>
                                    <td><span className="status-number status-pending">4</span></td>
                                    <td><span className="status-number status-progress">3</span></td>
                                    <td><span className="status-number status-completed">2</span></td>
                                    <td><span className="status-number status-overdue">1</span></td>
                                    <td className="total-tasks">10</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </main>
            </LayoutMain>
        </>
    );
};

export default List;