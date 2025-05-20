"use client";

import React, { useEffect, useState, useMemo, ChangeEvent, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from 'next/navigation';
// import { format as formatDateFns } from 'date-fns'; // Đã dùng formatTimeFromUtils
import L from 'leaflet';
import { Station, DataPoint, QueryOptions } from "@/types/station2";
import { getStations, getDataPointsOfStationById } from "@/lib/station";
import { getStatusTextColor, formatMonitoringTime as formatTimeFromUtils } from "@/lib/utils";
import { ElementRange } from '@/types/threshold';
import { getAllThresholdConfigs } from '@/lib/threshold';
import { getBestRecommend } from "@/lib/model";
import { BestRecommend } from "@/types/models";

import { Pagination } from "@/components/pagination2";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import StationDetails from "@/components/stationsDetails";
import Chartline from "@/components/linechart";
import PageLoader from "@/components/pageloader";
import MapUpdater from '@/components/MapUpdater';

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), { ssr: false });

let redIcon: L.Icon | undefined, blueIcon: L.Icon | undefined, createClusterCustomIcon: ((cluster: any) => L.DivIcon) | undefined;
if (typeof window !== "undefined") {
    const LGlobal = require("leaflet");
    redIcon = new LGlobal.Icon({
        iconUrl: "/red_one.png",
        iconSize: [38, 38] as L.PointTuple,
        iconAnchor: [19, 38] as L.PointTuple,
        popupAnchor: [0, -38] as L.PointTuple,
    });
    blueIcon = new LGlobal.Icon({
        iconUrl: "/blue_one.png",
        iconSize: [38, 38] as L.PointTuple,
        iconAnchor: [19, 38] as L.PointTuple,
        popupAnchor: [0, -38] as L.PointTuple,
    });
    createClusterCustomIcon = (cluster: any): L.DivIcon => {
        const count = cluster.getChildCount();
        const style = `
      background-color: rgba(51, 51, 51, 0.8);
      height: 2.5em;
      width: 2.5em;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 1rem;
      font-weight: bold;
      box-shadow: 0 0 5px rgba(0,0,0,0.5);
      border: 2px solid #fff;
    `;
        return LGlobal.divIcon({
            html: `<span style="${style}">${count}</span>`,
            className: "custom-marker-cluster",
            iconSize: LGlobal.point(40, 40, true),
        });
    };
}

function deriveStatusFromWqi(wqi: number | null | undefined): string {
    if (wqi === null || wqi === undefined || isNaN(wqi)) {
        return "Không xác định";
    }
    if (wqi > 91) return "Rất Tốt";
    if (wqi > 76) return "Tốt";
    if (wqi > 51) return "Trung Bình";
    if (wqi > 26) return "Kém";
    if (wqi >= 0) return "Rất Kém";
    return "Không xác định";
}

interface RealtimeIndicatorData {
    pH?: number;
    DO?: number;
    EC?: number;
    monitoring_time?: string;
}

export default function StationsPage() {
    const [thresholdConfigs, setThresholdConfigs] = useState<ElementRange[] | null>(null);
    const [isLoadingThresholds, setIsLoadingThresholds] = useState<boolean>(true);
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [historicalDataPoints, setHistoricalDataPoints] = useState<DataPoint[]>([]);
    const [groupedPredictionDataPoints, setGroupedPredictionDataPoints] = useState<Map<string, DataPoint[]>>(new Map());
    const [latestDataPoint, setLatestDataPoint] = useState<DataPoint | null>(null);
    const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);
    const [isLoadingDataPoints, setIsLoadingDataPoints] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<string>("pH");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [initialSelectionAttempted, setInitialSelectionAttempted] = useState(false);
    const [bestModel, setBestModel] = useState<string | null>(null);
    const [isLoadingBestModel, setIsLoadingBestModel] = useState<boolean>(false);
    const [isChartPredictModeOn, setIsChartPredictModeOn] = useState<boolean>(false);
    const [realtimeUpdateInterval] = useState<number>(5000);
    const webSocketRef = useRef<WebSocket | null>(null);
    const latestRawRealtimeDataRef = useRef<any | null>(null);
    const [realtimeIndicatorValues, setRealtimeIndicatorValues] = useState<RealtimeIndicatorData | null>(null);

    const itemsPerPage = 5;
    const initialMapCenter: L.LatLngExpression = [10.8231, 106.6297];
    const initialMapZoom = 10;
    const SELECTED_STATION_ZOOM = 14;

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // console.log("[StationsPage] Initializing: Fetching stations and thresholds.");
        setIsLoadingStations(true);
        setIsLoadingThresholds(true);
        setError(null);
        setInitialSelectionAttempted(false);

        Promise.all([
            getStations({ limit: 1000 }),
            getAllThresholdConfigs()
        ])
            .then(([stationsData, thresholdsData]) => {
                setStations(stationsData);
                const uniqueThresholdsMap = new Map<string, ElementRange>();
                thresholdsData.forEach(item => {
                    if (item.id) { uniqueThresholdsMap.set(item.id, item); }
                });
                const uniqueThresholds = Array.from(uniqueThresholdsMap.values());
                setThresholdConfigs(uniqueThresholds);
                // console.log("[StationsPage] Fetched and set thresholdConfigs:", uniqueThresholds);
            })
            .catch(err => {
                console.error("[StationsPage] Failed to fetch initial stations or thresholds:", err);
                setError("Không thể tải dữ liệu cần thiết (trạm hoặc ngưỡng). Vui lòng thử lại.");
                setThresholdConfigs([]);
            })
            .finally(() => {
                setIsLoadingStations(false);
                setIsLoadingThresholds(false);
            });
    }, []);

    const handleSelectStation = useCallback((station: Station) => {
        if (selectedStation?.id !== station.id) {
            // console.log(`[StationsPage] Selecting station: ${station.name} (ID: ${station.id})`);
            setSelectedStation(station);
            const newUrl = `/dashboardofficer/stations?id=${station.id}`;
            router.push(newUrl, { scroll: false });
            setRealtimeIndicatorValues(null);
            latestRawRealtimeDataRef.current = null;
            const currentStationList = searchTerm ? filteredStations : stations;
            const stationIndex = currentStationList.findIndex(s => s.id === station.id);

            if (stationIndex !== -1) {
                const targetPage = Math.floor(stationIndex / itemsPerPage) + 1;
                // console.log(`[StationsPage] Station ${stationToSelect.name} found at index ${stationIndex}, target page: ${targetPage}`);
                setCurrentPage(targetPage);
            } else {
                // console.warn(`[StationsPage] Selected station ${stationToSelect.name} not found in current list for pagination.`);
                // Có thể reset về trang 1 nếu không tìm thấy, hoặc giữ nguyên trang hiện tại
                setCurrentPage(1);
            }
            // console.log("[StationsPage] Cleared realtime data on station select.");
        }
    }, [selectedStation?.id, router, stations, searchTerm, itemsPerPage]);

    useEffect(() => {
        if (!isLoadingStations && stations.length > 0 && searchParams && !selectedStation && !initialSelectionAttempted) {
            const stationIdFromUrl = searchParams.get('id');
            let stationToSelect: Station | undefined = undefined;
            if (stationIdFromUrl) {
                stationToSelect = stations.find(s => s.id === stationIdFromUrl);
            }
            if (stationToSelect) {
                handleSelectStation(stationToSelect);
            }
            setInitialSelectionAttempted(true);
        }
    }, [
        stations, searchParams, selectedStation, isLoadingStations,
        initialSelectionAttempted, handleSelectStation
    ]);

    useEffect(() => {
        if (!selectedStation) {
            setHistoricalDataPoints([]);
            setGroupedPredictionDataPoints(new Map());
            setLatestDataPoint(null);
            setError(null);
            setBestModel(null);
            setRealtimeIndicatorValues(null);
            latestRawRealtimeDataRef.current = null;
            return;
        }
        setIsLoadingDataPoints(true);
        setError(null);
        setHistoricalDataPoints([]);
        setGroupedPredictionDataPoints(new Map());
        setLatestDataPoint(null);
        setBestModel(null);
        setRealtimeIndicatorValues(null);
        latestRawRealtimeDataRef.current = null;

        const queryOptions: QueryOptions = { limit: 200, sortBy: "monitoring_time", sortDesc: true };
        getDataPointsOfStationById(selectedStation.id, queryOptions)
            .then(data => {
                const historical: DataPoint[] = [];
                const predictionsBySource = new Map<string, DataPoint[]>();
                data.forEach(dp => {
                    try {
                        const monitoringDate = new Date(dp.monitoringTime);
                        if (isNaN(monitoringDate.getTime())) { return; }
                        if (dp.observationType === 'OBSERVATION_TYPE_PREDICTED') {
                            const source = dp.source || "Unknown";
                            if (!predictionsBySource.has(source)) {
                                predictionsBySource.set(source, []);
                            }
                            predictionsBySource.get(source)?.push(dp);
                        } else {
                            historical.push(dp);
                        }
                    } catch (e) {
                        console.error("[StationsPage] Error processing raw data point:", dp, e);
                    }
                });
                const latestHistorical = historical.length > 0 ? historical[0] : null;
                const sortedHistoricalAsc = [...historical].sort((a, b) => new Date(a.monitoringTime).getTime() - new Date(b.monitoringTime).getTime());
                const sortedGroupedPredictions = new Map<string, DataPoint[]>();
                predictionsBySource.forEach((points, source) => {
                    const sortedPoints = [...points].sort((a, b) => new Date(a.monitoringTime).getTime() - new Date(b.monitoringTime).getTime());
                    sortedGroupedPredictions.set(source, sortedPoints);
                });
                setHistoricalDataPoints(sortedHistoricalAsc);
                setGroupedPredictionDataPoints(sortedGroupedPredictions);
                setLatestDataPoint(latestHistorical);
                setSelectedFeature("pH");
            })
            .catch(err => {
                console.error(`[StationsPage] Failed to fetch API data points for station ${selectedStation.id}:`, err);
                setError(`Không thể tải dữ liệu cho trạm ${selectedStation.name}.`);
            })
            .finally(() => setIsLoadingDataPoints(false));
    }, [selectedStation]);

    useEffect(() => {
        if (!selectedStation?.id) {
            if (webSocketRef.current) { webSocketRef.current.close(); webSocketRef.current = null; }
            setRealtimeIndicatorValues(null);
            latestRawRealtimeDataRef.current = null;
            return;
        }
        const wsUrl = "wss://20.193.131.174.nip.io/ws/water-quality";
        if (webSocketRef.current) { webSocketRef.current.close(); }
        const ws = new WebSocket(wsUrl);
        webSocketRef.current = ws;
        ws.onopen = () => console.log(`[StationsPage] WebSocket connected for station ${selectedStation.id}`);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                if (data.station_id === selectedStation.id) {
                    latestRawRealtimeDataRef.current = data;
                }
            } catch (error) {
                console.error("[StationsPage] Error parsing WebSocket message:", error, "Raw data:", event.data);
            }
        };
        ws.onerror = (error) => console.error(`[StationsPage] WebSocket error for station ${selectedStation.id}:`, error);
        ws.onclose = (event) => {
            if (webSocketRef.current === ws) { webSocketRef.current = null; }
        };
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) { ws.close(); }
            if (webSocketRef.current === ws) { webSocketRef.current = null; }
        };
    }, [selectedStation?.id]);

    useEffect(() => {
        if (!selectedStation?.id) {
            setRealtimeIndicatorValues(null);
            return;
        }
        const intervalId = setInterval(() => {
            if (latestRawRealtimeDataRef.current) {
                const data = latestRawRealtimeDataRef.current;
                const newRealtimeValues: RealtimeIndicatorData = { monitoring_time: data.monitoring_time };
                if (data.features && Array.isArray(data.features)) {
                    data.features.forEach((feature: { name: string; value: any }) => {
                        const featureNameUpper = feature.name.toUpperCase();
                        if (featureNameUpper === "PH") newRealtimeValues.pH = Number(feature.value);
                        if (featureNameUpper === "DO") newRealtimeValues.DO = Number(feature.value);
                        if (featureNameUpper === "EC") newRealtimeValues.EC = Number(feature.value);
                    });
                }
                setRealtimeIndicatorValues(newRealtimeValues);
                latestRawRealtimeDataRef.current = null;
            }
        }, realtimeUpdateInterval);
        return () => clearInterval(intervalId);
    }, [selectedStation?.id, realtimeUpdateInterval]);
const handleChartPredictModeChange = useCallback((isOn: boolean) => {
        setIsChartPredictModeOn(isOn);
    }, []);
    useEffect(() => {
        // Chỉ fetch bestModel NẾU isChartPredictModeOn là true
        if (isChartPredictModeOn && selectedStation && selectedStation.id && selectedFeature) { // <<<< THÊM ĐIỀU KIỆN isChartPredictModeOn
            const fetchBestModel = async () => {
                setIsLoadingBestModel(true);
                setBestModel(null);
                const parameterNameToFetch = selectedFeature === "WQI" ? "pH" : selectedFeature;
                try {
                    const recommendations: BestRecommend = await getBestRecommend(selectedStation.id, parameterNameToFetch);
                    setBestModel(recommendations?.best_model || null);
                    // console.log("[StationsPage] Fetched best model:", recommendations?.best_model);
                } catch (error) {
                    console.error("[StationsPage] Failed to fetch best recommend:", error);
                    setBestModel(null);
                } finally {
                    setIsLoadingBestModel(false);
                }
            };
            fetchBestModel();
        } else {
            // Nếu predict mode tắt, hoặc không có station/feature, xóa best model
            setBestModel(null);
            setIsLoadingBestModel(false);
            // console.log("[StationsPage] Predict mode off or no station/feature, clearing best model.");
        }
    }, [selectedStation, selectedFeature, isChartPredictModeOn]); 

    const filteredStations = useMemo(() => {
        if (!searchTerm) return stations;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return stations.filter(station => station.name.toLowerCase().includes(lowerCaseSearch));
    }, [stations, searchTerm]);

    const uniqueStations = useMemo(() => {
        const coordMap = new Map<string, Station>();
        stations.forEach((station) => {
            if (typeof station.latitude === 'number' && typeof station.longitude === 'number' && !isNaN(station.latitude) && !isNaN(station.longitude)) {
                const coordKey = `${station.latitude.toFixed(5)},${station.longitude.toFixed(5)}`;
                if (!coordMap.has(coordKey)) { coordMap.set(coordKey, station); }
            }
        });
        return Array.from(coordMap.values());
    }, [stations]);

    const selectedStationInfo = useMemo(() => {
        if (!latestDataPoint) {
            return { wqi: null, status: "Không xác định", time: "N/A", recommendation: "Không có dữ liệu mới nhất." };
        }
        const wqi = latestDataPoint.wqi;
        const status = deriveStatusFromWqi(wqi);
        let recommendation = "Chất lượng nước tốt.";
        if (status === "Rất Kém") recommendation = "Nước ô nhiễm nặng. Cần xử lý và cảnh báo.";
        else if (status === "Kém") recommendation = "Chất lượng nước kém.";
        else if (status === "Trung Bình") recommendation = "Chất lượng nước trung bình.";
        return {
            wqi: wqi ?? "N/A", status: status,
            time: formatTimeFromUtils(latestDataPoint.monitoringTime), recommendation: recommendation
        };
    }, [latestDataPoint]);

    const availableFeatures = useMemo(() => {
        const desiredOrderOfFeatures = [
            'pH', 'DO', 'N-NO2',
            'N-NH4', 'P-PO4', 'TSS',
            'COD', 'EC', 'AH'
        ];
        const featuresPresent = new Set<string>();
        if (realtimeIndicatorValues?.pH !== undefined) featuresPresent.add('pH');
        if (realtimeIndicatorValues?.DO !== undefined) featuresPresent.add('DO');
        if (realtimeIndicatorValues?.EC !== undefined) featuresPresent.add('EC');
        if (latestDataPoint?.features) {
            latestDataPoint.features.forEach(f => { if (f.name) featuresPresent.add(f.name); });
        }
        return desiredOrderOfFeatures.filter(df =>
            featuresPresent.has(df) || featuresPresent.has(df.toUpperCase()) || featuresPresent.has(df.toLowerCase())
        );
    }, [latestDataPoint, realtimeIndicatorValues]);

    const chartInputData = useMemo(() => {
        if (historicalDataPoints.length === 0 && groupedPredictionDataPoints.size === 0) return null;
        return { historicalDataPoints, groupedPredictionDataPoints, selectedFeature };
    }, [historicalDataPoints, groupedPredictionDataPoints, selectedFeature]);

    const handlePageChange = (page: number) => {
        const currentTotalPages = Math.ceil(filteredStations.length / itemsPerPage);
        if (page > 0 && page <= (currentTotalPages > 0 ? currentTotalPages : 1)) {
            setCurrentPage(page);
        }
    };
    const handleFeatureChange = (event: ChangeEvent<HTMLSelectElement>) => setSelectedFeature(event.target.value);
    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => { setSearchTerm(event.target.value); setCurrentPage(1); };

    if (isLoadingStations || isLoadingThresholds) {
        return <PageLoader message="Đang tải dữ liệu khởi tạo..." />;
    }
    if (error && stations.length === 0 && !isLoadingStations) {
        return <div className="flex justify-center items-center h-screen text-red-600 font-semibold p-4">{error}</div>;
    }

    const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
    const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages > 0 ? totalPages : 1));
    const paginatedStations = filteredStations.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-grow overflow-y-auto space-y-4 p-4 bg-gray-50">
                <header className="flex justify-between items-center border-b pb-2 mb-4 bg-white p-4 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800">Trạm Quan Trắc Chất Lượng Nước</h1>
                    {error && !isLoadingDataPoints && selectedStation && <span className="text-sm text-red-500">{error}</span>}
                </header>

                <div className="flex flex-col md:flex-row flex-grow gap-4 min-h-[60vh]">
                    {/* Map Section */}
                    <div className="flex-grow md:w-2/3 lg:w-3/4 min-w-0 relative z-10 h-[50vh] md:h-auto border rounded-lg shadow-md overflow-hidden">
                        {typeof window !== 'undefined' && (
                            <MapContainer key="my-leaflet-map" center={initialMapCenter} zoom={initialMapZoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                                <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapUpdater station={selectedStation} zoomLevel={SELECTED_STATION_ZOOM} />
                                {createClusterCustomIcon && uniqueStations.length > 0 && (
                                    <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon} maxClusterRadius={60}>
                                        {uniqueStations.map((station) => (
                                            <Marker key={station.id} position={[station.latitude!, station.longitude!]} icon={selectedStation?.id === station.id ? blueIcon : redIcon} eventHandlers={{ click: () => handleSelectStation(station) }} zIndexOffset={selectedStation?.id === station.id ? 1000 : 0}>
                                                <Popup minWidth={180}><div className="text-sm">
                                                    <h3 className="text-md font-bold mb-1">{station.name}</h3>
                                                    <p className="text-xs text-gray-600 mb-1">{station.location || `(${station.latitude!.toFixed(4)}, ${station.longitude!.toFixed(4)})`}</p>
                                                    {selectedStation?.id === station.id && latestDataPoint && !isLoadingDataPoints && !error && (<> <hr className="my-1" /> <p>WQI: <span className="font-bold text-blue-600">{selectedStationInfo.wqi}</span></p> <p className={`${getStatusTextColor(selectedStationInfo.status)}`}>Trạng thái: {selectedStationInfo.status}</p> <p className="text-xs text-gray-500 mt-1">Lúc: {selectedStationInfo.time}</p> </>)}
                                                    {selectedStation?.id === station.id && isLoadingDataPoints && (<p className="text-xs text-gray-500 italic mt-1">Đang tải dữ liệu...</p>)}
                                                </div></Popup>
                                            </Marker>
                                        ))}
                                    </MarkerClusterGroup>
                                )}
                            </MapContainer>
                        )}
                    </div>
                    {/* Station List Table Section */}
                    <div className="w-full md:w-1/3 lg:w-1/4 p-0 min-w-[300px] flex flex-col border rounded-lg shadow-md bg-white">
                        <div className="p-3 border-b"><Input type="text" placeholder="Tìm kiếm theo tên trạm..." value={searchTerm} onChange={handleSearchChange} className="w-full text-sm" /></div>
                        <div className="flex-grow overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="py-2 px-3 text-sm font-semibold text-gray-600">Tên Trạm</TableHead>
                                        <TableHead className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Vị Trí</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStations ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-gray-500 py-4">Đang tải trạm...</TableCell>
                                        </TableRow>
                                    ) : paginatedStations.length > 0 ? (
                                        paginatedStations.map((station) => (
                                            <TableRow
                                                key={station.id}
                                                onClick={() => handleSelectStation(station)}
                                                className={`cursor-pointer transition-colors duration-150 ${selectedStation?.id === station.id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-50"}`}
                                            >
                                                <TableCell className={`font-medium py-2 px-3 text-sm ${selectedStation?.id === station.id ? 'text-blue-800' : ''}`}>{station.name}</TableCell>
                                                <TableCell className="text-right text-xs text-gray-500 py-2 px-3">
                                                    {station.location || (typeof station.latitude === 'number' && typeof station.longitude === 'number' ? `(${station.latitude.toFixed(2)}, ${station.longitude.toFixed(2)})` : 'Không rõ')}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                                                {(searchTerm && filteredStations.length === 0) ? 'Không tìm thấy trạm phù hợp.' : 'Không có trạm nào.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && (<div className="mt-auto p-2 border-t bg-gray-50"><Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} siblingCount={0} /></div>)}
                    </div>
                </div>

                {/* Station Details Section */}
                <div className="w-full mt-6">
                    {isLoadingDataPoints && selectedStation && (<PageLoader message={`Đang tải dữ liệu chi tiết cho trạm ${selectedStation.name}...`} />)}
                    {!isLoadingDataPoints && selectedStation && latestDataPoint && !error && (
                        <StationDetails
                            selectedStation={{
                                ...(selectedStation as Station),
                                ...selectedStationInfo,
                                createdAt: selectedStation.createdAt // Đảm bảo createdAt được truyền
                            }}
                            latestDataPoint={latestDataPoint}
                            availableFeatures={availableFeatures}
                            thresholds={thresholdConfigs}
                            realtimeIndicatorValues={realtimeIndicatorValues}
                        />
                    )}
                    {!isLoadingDataPoints && selectedStation && !latestDataPoint && !realtimeIndicatorValues && !error && (<div className="text-center text-gray-600 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">Không có dữ liệu đo gần đây cho trạm {selectedStation.name}.</div>)}
                    {!isLoadingDataPoints && selectedStation && error && (<div className="text-center text-red-600 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">{error}</div>)}
                    {!selectedStation && !isLoadingStations && stations.length > 0 && (<div className="text-center text-gray-500 mt-4 p-4 bg-gray-100 border rounded-lg shadow-sm">Chọn một trạm để xem chi tiết.</div>)}
                </div>

                {/* Chart Section */}
                <div className="mt-6 w-full p-4 border rounded-lg shadow-md bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Biểu đồ diễn biến chất lượng nước</h2>
                    {isLoadingDataPoints && selectedStation && (<div className="h-80 flex justify-center items-center bg-gray-50 rounded-lg"><p className="text-gray-500 italic">Đang tải dữ liệu biểu đồ...</p></div>)}
                    {!isLoadingDataPoints && selectedStation && (<> {!error ? ((chartInputData && (chartInputData.historicalDataPoints.length > 0 || chartInputData.groupedPredictionDataPoints.size > 0)) ? (<> <div className="flex justify-center mb-4"> <select value={selectedFeature} onChange={handleFeatureChange} className="border rounded-md p-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out text-sm" aria-label="Chọn chỉ số hiển thị trên biểu đồ"> {availableFeatures.map((featureName) => (<option key={featureName} value={featureName}>{`Chỉ số ${featureName}`}</option>))} <option value="WQI">Chỉ số chất lượng nước (WQI)</option> </select> </div> <div className="relative h-100"> <Chartline bestmodel={bestModel} historicalDataPoints={chartInputData.historicalDataPoints} groupedPredictionDataPoints={chartInputData.groupedPredictionDataPoints} selectedFeature={chartInputData.selectedFeature} title={`${selectedFeature === 'WQI' ? 'WQI' : `Chỉ số ${selectedFeature}`}`} onPredictModeChange={handleChartPredictModeChange}/> </div> </>) : (<div className="flex justify-center items-center h-60 bg-gray-50 text-gray-600 font-semibold rounded-lg mt-4 p-4">Không có đủ dữ liệu để vẽ biểu đồ.</div>)) : (<div className="flex justify-center items-center h-60 bg-red-50 text-red-700 font-semibold rounded-lg mt-4 p-4 border border-red-200">{error}</div>)} </>)}
                    {!selectedStation && (<div className="flex justify-center items-center h-60 bg-gray-50 text-gray-500 font-semibold rounded-lg mt-4 p-4">Vui lòng chọn một trạm để xem biểu đồ.</div>)}
                </div>
            </div>
        </div>
    );
}