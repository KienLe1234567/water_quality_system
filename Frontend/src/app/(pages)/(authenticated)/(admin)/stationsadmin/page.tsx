"use client";

import React, { useEffect, useState, useMemo, ChangeEvent, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from 'next/navigation'; 
import { format } from 'date-fns';
import L from 'leaflet';
import { Station, DataPoint, QueryOptions, Indicator } from "@/types/station2"; 
import { getStations, getDataPointsOfStationById } from "@/lib/station"; 
import { getStatusTextColor } from "@/lib/utils"; 
import { ElementRange } from '@/types/threshold'; 
import { getAllThresholdConfigs } from '@/lib/threshold';
import { getBestRecommend } from "@/lib/model"; 
import { BestRecommend } from "@/types/models"; 

// Import các UI components
import { Pagination } from "@/components/pagination2"; // Đảm bảo đường dẫn đúng
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { Input } from "@/components/ui/input"; 

// Import các components tùy chỉnh
import StationDetails from "@/components/stationsDetails"; // Đảm bảo đường dẫn đúng
import Chartline from "@/components/linechart"; // Đảm bảo đường dẫn đúng
import PageLoader from "@/components/pageloader"; // Đảm bảo đường dẫn đúng
import MapUpdater from '@/components/MapUpdater'; // Đảm bảo đường dẫn đúng

// Import CSS cho Leaflet
import "leaflet/dist/leaflet.css";

// --- Dynamic Imports cho các component của Leaflet (chỉ chạy phía client) ---
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), { ssr: false });


// --- Định nghĩa Icons cho Leaflet (chỉ chạy phía client) ---
let redIcon: L.Icon | undefined, blueIcon: L.Icon | undefined, createClusterCustomIcon: ((cluster: any) => L.DivIcon) | undefined;
if (typeof window !== "undefined") {
    // Đảm bảo Leaflet chỉ được require ở client-side
    const LGlobal = require("leaflet");

    // Icon màu đỏ cho trạm không được chọn
    redIcon = new LGlobal.Icon({
        iconUrl: "/red_one.png", // Đường dẫn tương đối từ thư mục /public
        iconSize: [38, 38] as L.PointTuple,
        iconAnchor: [19, 38] as L.PointTuple,
        popupAnchor: [0, -38] as L.PointTuple,
    });

    // Icon màu xanh cho trạm đang được chọn
    blueIcon = new LGlobal.Icon({
        iconUrl: "/blue_one.png", // Đường dẫn tương đối từ thư mục /public
        iconSize: [38, 38] as L.PointTuple,
        iconAnchor: [19, 38] as L.PointTuple,
        popupAnchor: [0, -38] as L.PointTuple,
    });

    // Hàm tạo icon tùy chỉnh cho các cụm marker
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


// --- Hàm hỗ trợ ---

// Hàm xác định trạng thái chất lượng nước từ chỉ số WQI
function deriveStatusFromWqi(wqi: number | null | undefined): string {
    if (wqi === null || wqi === undefined || isNaN(wqi)) {
        return "Không xác định";
    }
    // Dựa trên QCVN 08-MT:2015/BTNMT (ví dụ)
    if (wqi > 91) return "Rất Tốt";
    if (wqi > 76) return "Tốt";
    if (wqi > 51) return "Trung Bình";
    if (wqi > 26) return "Kém";
    if (wqi >= 0) return "Rất Kém";
    return "Không xác định";
}

// Hàm định dạng thời gian quan trắc
function formatMonitoringTime(timeString: string | undefined | null): string {
    if (!timeString) return "N/A";
    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
            console.error("Invalid date format received:", timeString);
            return timeString; // Trả về chuỗi gốc nếu không hợp lệ
        }
        return format(date, 'HH:mm, dd/MM/yyyy'); // Định dạng giờ:phút, ngày/tháng/năm
    } catch (e) {
        console.error("Failed to format time:", timeString, e);
        return timeString; // Trả về chuỗi gốc nếu có lỗi
    }
}

// --- Component chính ---
export default function StationsPage() {
    // --- State Variables ---
    const [thresholdConfigs, setThresholdConfigs] = useState<ElementRange[] | null>(null); // Bắt đầu là null
    const [isLoadingThresholds, setIsLoadingThresholds] = useState<boolean>(true);
    const [stations, setStations] = useState<Station[]>([]); // Danh sách tất cả trạm
    const [selectedStation, setSelectedStation] = useState<Station | null>(null); // Trạm đang được chọn
    const [selectedStationDataPoints, setStationDataPoints] = useState<DataPoint[]>([]); // Dữ liệu gốc của trạm được chọn (nếu cần)
    const [historicalDataPoints, setHistoricalDataPoints] = useState<DataPoint[]>([]); // Dữ liệu lịch sử
    const [groupedPredictionDataPoints, setGroupedPredictionDataPoints] = useState<Map<string, DataPoint[]>>(new Map());
    const [latestDataPoint, setLatestDataPoint] = useState<DataPoint | null>(null); // Điểm dữ liệu lịch sử mới nhất
    const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true); // Trạng thái tải danh sách trạm
    const [isLoadingDataPoints, setIsLoadingDataPoints] = useState<boolean>(false); // Trạng thái tải dữ liệu chi tiết của trạm
    const [error, setError] = useState<string | null>(null); // Lỗi (chung hoặc khi tải dữ liệu trạm)
    const [selectedFeature, setSelectedFeature] = useState<string>("pH"); // Chỉ số đang chọn để hiển thị trên biểu đồ
    const [currentPage, setCurrentPage] = useState<number>(1); // Trang hiện tại của bảng
    const [searchTerm, setSearchTerm] = useState<string>(""); // Từ khóa tìm kiếm trong bảng
    const [initialSelectionAttempted, setInitialSelectionAttempted] = useState(false); // Cờ đánh dấu đã thử chọn trạm từ URL hay chưa

    const [bestModel, setBestModel] = useState<string | null>(null);
    const [isLoadingBestModel, setIsLoadingBestModel] = useState<boolean>(false); 

    // --- Constants ---
    const itemsPerPage = 5; // Số trạm trên mỗi trang của bảng
    const initialMapCenter: L.LatLngExpression = [10.8231, 106.6297]; // Tọa độ trung tâm bản đồ mặc định (TP.HCM)
    const initialMapZoom = 10; // Mức zoom bản đồ mặc định
    const SELECTED_STATION_ZOOM = 14; // Mức zoom khi chọn một trạm

    // --- Hook để lấy search params từ URL ---
    const searchParams = useSearchParams();
    const router = useRouter();

    // --- Data Fetching Effects ---
    useEffect(() => {
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
            console.log("Fetched Thresholds in StationsPage:", uniqueThresholds);
        })
        .catch(err => {
            console.error("Failed to fetch initial stations or thresholds:", err);
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
            console.log(`Selecting station: ${station.name} (ID: ${station.id})`);
            setSelectedStation(station);
            const newUrl = `/stationsadmin?id=${station.id}`;
            router.push(newUrl, { scroll: false });
        }
    }, [selectedStation?.id, router]); // Bỏ stations, itemsPerPage vì không cần thiết cho logic này nữa

    useEffect(() => {
        if (!isLoadingStations && stations.length > 0 && searchParams && !selectedStation && !initialSelectionAttempted) {
            const stationIdFromUrl = searchParams.get('id');
            let stationToSelect: Station | undefined = undefined;

            if (stationIdFromUrl) {
                stationToSelect = stations.find(s => s.id === stationIdFromUrl);
                if (stationToSelect) {
                    console.log(`Found station from URL parameter "id": ${stationToSelect.name}`);
                } else {
                    console.warn(`Station ID "${stationIdFromUrl}" from URL parameter "id" not found.`);
                }
            } else {
                const firstKey = searchParams.keys().next().value;
                if (firstKey) {
                    console.warn(`URL parameter "id" not found. Attempting to use first query key "${firstKey}" as ID.`);
                    stationToSelect = stations.find(s => s.id === firstKey);
                    if (stationToSelect) {
                        console.log(`Found station from URL (first key fallback): ${stationToSelect.name}`);
                    } else {
                        console.warn(`Station ID "${firstKey}" from first URL query key not found.`);
                    }
                }
            }

            if (stationToSelect) {
                handleSelectStation(stationToSelect);
            }
            setInitialSelectionAttempted(true);
        }
    }, [
        stations,
        searchParams,
        selectedStation,
        isLoadingStations,
        initialSelectionAttempted,
        handleSelectStation
    ]);

    useEffect(() => {
        if (!selectedStation) {
            setStationDataPoints([]);
            setHistoricalDataPoints([]);
            setGroupedPredictionDataPoints(new Map());
            setLatestDataPoint(null);
            setError(null);
            setBestModel(null); // *** RESET BEST MODEL KHI KHÔNG CÓ TRẠM NÀO ĐƯỢC CHỌN ***
            return;
        }

        setIsLoadingDataPoints(true);
        setError(null);
        setStationDataPoints([]);
        setHistoricalDataPoints([]);
        setGroupedPredictionDataPoints(new Map());
        setLatestDataPoint(null);
        setBestModel(null); // *** RESET BEST MODEL KHI CHỌN TRẠM MỚI (TRƯỚC KHI FETCH) ***


        const queryOptions: QueryOptions = { limit: 200, sortBy: "monitoring_time", sortDesc: true };

        getDataPointsOfStationById(selectedStation.id, queryOptions)
            .then(data => {
                setStationDataPoints(data);
                const historical: DataPoint[] = [];
                const predictionsBySource = new Map<string, DataPoint[]>();

                data.forEach(dp => {
                    try {
                        const monitoringDate = new Date(dp.monitoringTime);
                        if (isNaN(monitoringDate.getTime())) {
                            console.warn("Invalid monitoringTime found, skipping DataPoint:", dp.monitoringTime, "for ID:", dp.id);
                            return;
                        }
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
                         console.error("Error processing raw data point:", dp, e);
                    }
                });

                const latestHistorical = historical.length > 0 ? historical[0] : null;
                const sortedHistoricalAsc = [...historical].sort((a, b) => new Date(a.monitoringTime).getTime() - new Date(b.monitoringTime).getTime());
                const sortedGroupedPredictions = new Map<string, DataPoint[]>();
                predictionsBySource.forEach((points, source) => {
                    const sortedPoints = [...points].sort((a, b) => new Date(a.monitoringTime).getTime() - new Date(b.monitoringTime).getTime());
                    sortedGroupedPredictions.set(source, sortedPoints);
                });

                console.log("Processed Historical Data (ASC):", sortedHistoricalAsc.length);
                console.log("Processed Grouped Prediction Data (ASC):", sortedGroupedPredictions);

                setHistoricalDataPoints(sortedHistoricalAsc);
                setGroupedPredictionDataPoints(sortedGroupedPredictions);
                setLatestDataPoint(latestHistorical);
                setSelectedFeature("pH"); // Reset về pH khi chọn trạm mới (sẽ trigger useEffect lấy best model cho pH)
            })
            .catch(err => {
                console.error(`Failed to fetch data points for station ${selectedStation.id}:`, err);
                setError(`Không thể tải dữ liệu cho trạm ${selectedStation.name}.`);
                setLatestDataPoint(null);
                setHistoricalDataPoints([]);
                setGroupedPredictionDataPoints(new Map());
            })
            .finally(() => {
                setIsLoadingDataPoints(false);
            });
    }, [selectedStation]);


    // *** EFFECT MỚI ĐỂ LẤY BEST RECOMMENDATION ***
    useEffect(() => {
        if (selectedStation && selectedStation.id && selectedFeature) {
            const fetchBestModel = async () => {
                setIsLoadingBestModel(true);
                setBestModel(null); // Reset trước khi fetch mới

                // Nếu selectedFeature là "WQI", truyền "pH" vào API
                const parameterNameToFetch = selectedFeature === "WQI" ? "pH" : selectedFeature;
                
                console.log(`Fetching best model for station: ${selectedStation.id}, parameter: ${parameterNameToFetch} (selected feature: ${selectedFeature})`);

                try {
                    const recommendations: BestRecommend = await getBestRecommend(selectedStation.id, parameterNameToFetch);
                    if (recommendations) {
                        setBestModel(recommendations.best_model);
                        console.log("Best model set:", recommendations.best_model, "for parameter:", recommendations.parameter_name);
                        // Bạn có thể muốn làm gì đó với các thông tin khác trong firstRecommendation ở đây
                        // ví dụ: setBestMetricValue(firstRecommendation.best_metric_value);
                    } else {
                        console.log("No best model recommendations found for parameter:", parameterNameToFetch);
                        setBestModel(null); // Không tìm thấy model nào
                    }
                } catch (error) {
                    console.error("Failed to fetch best recommend:", error);
                    setBestModel(null); // Lỗi khi fetch
                } finally {
                    setIsLoadingBestModel(false);
                }
            };

            fetchBestModel();
        } else {
            // Nếu không có trạm hoặc feature được chọn, đảm bảo bestModel là null
            setBestModel(null);
            setIsLoadingBestModel(false);
        }
    }, [selectedStation, selectedFeature]); // Chạy lại khi selectedStation hoặc selectedFeature thay đổi

    // --- Memoized Calculations ---
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
                if (!coordMap.has(coordKey)) {
                    coordMap.set(coordKey, station);
                }
            } else {
                console.warn(`Station ${station.id} (${station.name}) has invalid coordinates:`, station.latitude, station.longitude);
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

        if (status === "Rất Kém") recommendation = "Nước ô nhiễm nặng, chỉ thích hợp cho giao thông thủy và các mục đích tương đương. Cần có biện pháp xử lý và cảnh báo.";
        else if (status === "Kém") recommendation = "Chất lượng nước kém, chỉ sử dụng cho mục đích giao thông thủy và các mục đích tương đương khác.";
        else if (status === "Trung Bình") recommendation = "Chất lượng nước trung bình, sử dụng cho mục đích tưới tiêu và các mục đích tương đương khác.";
        else if (status === "Tốt") recommendation = "Chất lượng nước tốt, có thể sử dụng cho mục đích cấp nước sinh hoạt nhưng cần các biện pháp xử lý phù hợp.";
        else if (status === "Rất Tốt") recommendation = "Chất lượng nước rất tốt, sử dụng tốt cho mục đích cấp nước sinh hoạt.";

        return {
            wqi: wqi ?? "N/A",
            status: status,
            time: formatMonitoringTime(latestDataPoint.monitoringTime),
            recommendation: recommendation
        };
    }, [latestDataPoint]);

    const availableFeatures = useMemo(() => {
        const desiredFeatures = ['pH', 'DO', 'N-NO2', 'N-NH4', 'P-PO4', 'TSS', 'COD', 'EC', 'AH'];
        if (!latestDataPoint || !latestDataPoint.features || latestDataPoint.features.length === 0) {
            return [];
        }
        const actualFeatureNames = new Set(latestDataPoint.features.map(f => f.name).filter((name): name is string => !!name));
        return desiredFeatures.filter(desiredName => actualFeatureNames.has(desiredName));
    }, [latestDataPoint]);

    const chartInputData = useMemo(() => {
        if (historicalDataPoints.length === 0 && groupedPredictionDataPoints.size === 0) return null;
        return {
            historicalDataPoints: historicalDataPoints,
            groupedPredictionDataPoints: groupedPredictionDataPoints,
            selectedFeature: selectedFeature
        };
    }, [historicalDataPoints, groupedPredictionDataPoints, selectedFeature]);

    const handlePageChange = (page: number) => {
        const currentTotalPages = Math.ceil(filteredStations.length / itemsPerPage);
        if (page > 0 && page <= (currentTotalPages > 0 ? currentTotalPages : 1) ) {
            setCurrentPage(page);
        }
    };

    const handleFeatureChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedFeature(event.target.value);
        // Việc gọi API getBestRecommend sẽ được xử lý bởi useEffect lắng nghe selectedFeature
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    // --- Render Logic ---
    if (isLoadingStations) {
        return <PageLoader message="Đang tải danh sách trạm..." />;
    }

    if (error && stations.length === 0 && !isLoadingStations) {
        return <div className="flex justify-center items-center h-screen text-red-600 font-semibold p-4">{error}</div>;
    }

    const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
    const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages > 0 ? totalPages : 1));
    const paginatedStations = filteredStations.slice(
        (safeCurrentPage - 1) * itemsPerPage,
        safeCurrentPage * itemsPerPage
    );

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-grow overflow-y-auto space-y-4 p-4 bg-gray-50">

                <header className="flex justify-between items-center border-b pb-2 mb-4 bg-white p-4 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800">Trạm Quan Trắc Chất Lượng Nước</h1>
                    {/* Có thể thêm thông tin về bestModel ở đây nếu muốn */}
                    {/* {bestModel && <span className="text-sm text-green-600">Best model for {selectedFeature}: {bestModel}</span>} */}
                    {/* {isLoadingBestModel && <span className="text-sm text-blue-500">Finding best model...</span>} */}
                    {error && !isLoadingDataPoints && selectedStation && <span className="text-sm text-red-500">{error}</span>}
                 </header>

                <div className="flex flex-col md:flex-row flex-grow gap-4 min-h-[60vh]">
                    <div className="flex-grow md:w-2/3 lg:w-3/4 min-w-0 relative z-10 h-[50vh] md:h-auto border rounded-lg shadow-md overflow-hidden">
                        {typeof window !== 'undefined' && (
                            <MapContainer
                                key="my-leaflet-map"
                                center={initialMapCenter}
                                zoom={initialMapZoom}
                                style={{ height: "100%", width: "100%" }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapUpdater station={selectedStation} zoomLevel={SELECTED_STATION_ZOOM} />

                                {createClusterCustomIcon && uniqueStations.length > 0 && (
                                    <MarkerClusterGroup
                                        chunkedLoading
                                        iconCreateFunction={createClusterCustomIcon}
                                        maxClusterRadius={60}
                                    >
                                        {uniqueStations.map((station) => {
                                            const isValidPosition = typeof station.latitude === 'number' && typeof station.longitude === 'number';
                                            if (!isValidPosition) return null;
                                            const isSelected = selectedStation?.id === station.id;
                                            return (
                                                <Marker
                                                    key={station.id}
                                                    position={[station.latitude, station.longitude]}
                                                    icon={isSelected ? blueIcon : redIcon}
                                                    eventHandlers={{
                                                        click: () => handleSelectStation(station),
                                                    }}
                                                    zIndexOffset={isSelected ? 1000 : 0}
                                                >
                                                    <Popup minWidth={180}>
                                                        <div className="text-sm">
                                                            <h3 className="text-md font-bold mb-1">{station.name}</h3>
                                                            <p className="text-xs text-gray-600 mb-1">
                                                                {station.location || `(${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)})`}
                                                            </p>
                                                            {isSelected && latestDataPoint && !isLoadingDataPoints && !error && (
                                                                <>
                                                                    <hr className="my-1" />
                                                                    <p>WQI: <span className="font-bold text-blue-600">{selectedStationInfo.wqi}</span></p>
                                                                    <p className={`${getStatusTextColor(selectedStationInfo.status)}`}>Trạng thái: {selectedStationInfo.status}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">Lúc: {selectedStationInfo.time}</p>
                                                                </>
                                                            )}
                                                            {isSelected && isLoadingDataPoints && (<p className="text-xs text-gray-500 italic mt-1">Đang tải dữ liệu...</p>)}
                                                            {isSelected && !isLoadingDataPoints && error && (<p className="text-xs text-red-500 italic mt-1">{error}</p>)}
                                                            {isSelected && !isLoadingDataPoints && !latestDataPoint && !error && (<p className="text-xs text-orange-500 italic mt-1">Không có dữ liệu mới.</p>)}
                                                            {!isSelected && (<p className="text-xs text-blue-500 italic mt-2">Nhấn để xem chi tiết</p>)}
                                                         </div>
                                                     </Popup>
                                                 </Marker>
                                             );
                                         })}
                                     </MarkerClusterGroup>
                                 )}
                             </MapContainer>
                         )}
                     </div>

                    <div className="w-full md:w-1/3 lg:w-1/4 p-0 min-w-[300px] flex flex-col border rounded-lg shadow-md bg-white">
                        <div className="p-3 border-b">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo tên trạm..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full text-sm"
                             />
                         </div>
                        <div className="flex-grow overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-100 z-10 shadow-sm"><TableRow><TableHead className="py-2 px-3 text-sm font-semibold text-gray-600">Tên Trạm</TableHead><TableHead className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Vị Trí</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingStations ? (
                                         <TableRow><TableCell colSpan={2} className="text-center text-gray-500 py-4">Đang tải trạm...</TableCell></TableRow>
                                     ) : paginatedStations.length > 0 ? (
                                         paginatedStations.map((station) => {
                                             const isSelected = selectedStation?.id === station.id;
                                             return (
                                                 <TableRow
                                                     key={station.id}
                                                     onClick={() => handleSelectStation(station)}
                                                     className={`cursor-pointer transition-colors duration-150 ${isSelected ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-50"}`}
                                                 >
                                                     <TableCell className={`font-medium py-2 px-3 text-sm ${isSelected ? 'text-blue-800' : ''}`}>{station.name}</TableCell>
                                                     <TableCell className="text-right text-xs text-gray-500 py-2 px-3">
                                                         {station.location || (typeof station.latitude === 'number' && typeof station.longitude === 'number' ? `(${station.latitude.toFixed(2)}, ${station.longitude.toFixed(2)})` : 'Không rõ')}
                                                     </TableCell>
                                                 </TableRow>
                                             );
                                         })
                                     ) : (
                                          <TableRow><TableCell colSpan={2} className="text-center text-gray-500 py-4">{(searchTerm && filteredStations.length === 0) ? 'Không tìm thấy trạm phù hợp.' : 'Không có trạm nào.'}</TableCell></TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                         {totalPages > 1 && (
                            <div className="mt-auto p-2 border-t bg-gray-50">
                                <Pagination
                                    currentPage={safeCurrentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    siblingCount={0}
                                />
                            </div>
                         )}
                     </div>
                </div>

                <div className="w-full mt-6">
                     {isLoadingDataPoints && selectedStation && (
                         <PageLoader message={`Đang tải dữ liệu chi tiết cho trạm ${selectedStation.name}...`} />
                     )}
                    {!isLoadingDataPoints && selectedStation && latestDataPoint && !error && (
                        <StationDetails
                            selectedStation={{
                                ...(selectedStation as Station),
                                ...selectedStationInfo,
                            }}
                            latestDataPoint={latestDataPoint}
                            availableFeatures={availableFeatures}
                            thresholds={thresholdConfigs}
                        />
                    )}
                    {!isLoadingDataPoints && selectedStation && !latestDataPoint && !error && (
                         <div className="text-center text-gray-600 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">Không có dữ liệu đo gần đây cho trạm {selectedStation.name}.</div>
                    )}
                    {!isLoadingDataPoints && selectedStation && error && (
                         <div className="text-center text-red-600 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">{error}</div>
                    )}
                    {!selectedStation && !isLoadingStations && stations.length > 0 && (
                         <div className="text-center text-gray-500 mt-4 p-4 bg-gray-100 border rounded-lg shadow-sm">Chọn một trạm trên bản đồ hoặc từ bảng bên trái để xem chi tiết và biểu đồ.</div>
                     )}
                     {!isLoadingStations && stations.length === 0 && error && (
                         <div className="text-center text-red-600 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">Không thể tải danh sách trạm. Vui lòng kiểm tra kết nối và thử lại.</div>
                     )}
                </div>

                <div className="mt-6 w-full p-4 border rounded-lg shadow-md bg-white">
                    <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Biểu đồ diễn biến chất lượng nước</h2>
                    {/* Hiển thị thông tin bestModel nếu có */}
                    {/* {selectedStation && selectedFeature && !isLoadingBestModel && bestModel && (
                        <div className="text-center text-sm text-green-700 mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            Mô hình tốt nhất cho chỉ số <span className="font-semibold">{selectedFeature === "WQI" ? "pH (cho WQI)" : selectedFeature}</span>: <span className="font-bold">{bestModel}</span>
                        </div>
                    )}
                    {selectedStation && selectedFeature && isLoadingBestModel && (
                        <div className="text-center text-sm text-blue-700 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            Đang tìm mô hình tốt nhất cho <span className="font-semibold">{selectedFeature === "WQI" ? "pH (cho WQI)" : selectedFeature}</span>...
                        </div>
                    )}
                     {selectedStation && selectedFeature && !isLoadingBestModel && !bestModel && (
                        <div className="text-center text-sm text-yellow-700 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            Không tìm thấy mô hình khuyến nghị cho <span className="font-semibold">{selectedFeature === "WQI" ? "pH (cho WQI)" : selectedFeature}</span>.
                        </div>
                    )} */}

                    {isLoadingDataPoints && selectedStation && (
                         <div className="h-80 flex justify-center items-center bg-gray-50 rounded-lg"><p className="text-gray-500 italic">Đang tải dữ liệu biểu đồ...</p></div>
                     )}
                     {!isLoadingDataPoints && selectedStation && (
                         <>
                             {!error ? (
                                 <>
                                    {(chartInputData && (chartInputData.historicalDataPoints.length > 0 || chartInputData.groupedPredictionDataPoints.size > 0)) ? (
                                         <>
                                            <div className="flex justify-center mb-4">
                                                <select
                                                     value={selectedFeature}
                                                     onChange={handleFeatureChange}
                                                     className="border rounded-md p-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out text-sm"
                                                     aria-label="Chọn chỉ số hiển thị trên biểu đồ"
                                                 >
                                                     {availableFeatures.map((featureName) => (
                                                         <option key={featureName} value={featureName}>Chỉ số {featureName}</option>
                                                     ))}
                                                     <option value="WQI">Chỉ số chất lượng nước (WQI)</option>
                                                     {availableFeatures.length === 0 && latestDataPoint && <option disabled>Không có chỉ số thành phần</option>}
                                                 </select>
                                             </div>
                                            <div className="relative h-100">
                                                <Chartline
                                                     bestmodel={bestModel}
                                                     historicalDataPoints={chartInputData.historicalDataPoints}
                                                     groupedPredictionDataPoints={chartInputData.groupedPredictionDataPoints}
                                                     selectedFeature={chartInputData.selectedFeature}
                                                     title={`${selectedFeature === 'WQI' ? 'WQI' : `Chỉ số ${selectedFeature}`}`}
                                                 />
                                             </div>
                                         </>
                                     ) : (
                                         <div className="flex justify-center items-center h-60 bg-gray-50 text-gray-600 font-semibold rounded-lg mt-4 p-4">Không có đủ dữ liệu (lịch sử hoặc dự đoán) để vẽ biểu đồ cho trạm này.</div>
                                     )}
                                 </>
                             ) : (
                                  <div className="flex justify-center items-center h-60 bg-red-50 text-red-700 font-semibold rounded-lg mt-4 p-4 border border-red-200">{error}</div>
                              )}
                          </>
                      )}
                      {!selectedStation && (
                           <div className="flex justify-center items-center h-60 bg-gray-50 text-gray-500 font-semibold rounded-lg mt-4 p-4">Vui lòng chọn một trạm để xem biểu đồ.</div>
                       )}
                 </div>
             </div>
         </div>
     );
}