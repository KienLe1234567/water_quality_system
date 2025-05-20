// File: src/components/stationsDetails.tsx
import {
  Card, CardHeader, CardContent, CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Clock, MapPin, Thermometer, Droplet, Zap,
  FlaskConical, Beaker, TestTube, HelpCircle, Waves, Gauge, Info,
  FlaskRound
} from "lucide-react";
import { Station as BaseStation, DataPoint } from "@/types/station2";
import { ElementRange } from '@/types/threshold';
import { useCallback } from 'react';
import { cn, getDonvi, formatMonitoringTime } from "@/lib/utils";
import { parseISO, format as formatDateFns } from 'date-fns';

interface CombinedStationInfo extends BaseStation {
  wqi: number | string | null;
  status: string;
  time: string;
  recommendation: string;
  // createdAt đã có trong BaseStation (nếu kiểu Station của bạn có)
}

interface RealtimeIndicatorData {
    pH?: number;
    DO?: number;
    EC?: number;
    monitoring_time?: string;
}

interface StationDetailsProps {
  selectedStation: CombinedStationInfo | null;
  latestDataPoint: DataPoint | null; // Vẫn cần để lấy các feature không real-time
  availableFeatures: string[]; // Danh sách feature đã được lọc và sắp xếp từ StationsPage
  thresholds: ElementRange[] | null;
  realtimeIndicatorValues: RealtimeIndicatorData | null;
}

function getIconForFeature(featureName: string) {
   switch (featureName.toUpperCase()) {
      case 'PH': return FlaskRound;
      case 'DO': return Droplet;
      case 'N-NO2': return Beaker; // N-NO2
      case 'N-NH4': return FlaskConical; // N-NH4
      case 'P-PO4': return TestTube; // P-PO4
      case 'TSS': return Waves;
      case 'COD': return Activity;
      case 'EC': return Zap;
      case 'AH': return HelpCircle; // AH (Aeromonas Hydrophila)
      // Thêm các icon khác nếu cần
      default: return HelpCircle;
  }
}

export default function StationDetails({
  selectedStation,
  latestDataPoint,
  availableFeatures,
  thresholds,
  realtimeIndicatorValues
}: StationDetailsProps) {

  const isValueOutOfRange = useCallback((
      featureName: string,
      value: string | number | null,
      thresholdsToCheck: ElementRange[] | null
  ): boolean => {
      if (value === null || thresholdsToCheck === null || thresholdsToCheck.length === 0) return false;
      const numericValue = Number(value);
      if (isNaN(numericValue)) return false;
      const keyLower = featureName.toLowerCase();
      const config = thresholdsToCheck.find(c => c.elementName.toLowerCase() === keyLower);
      if (!config) return false;
      const { minValue, maxValue } = config;
      if (minValue !== null && typeof minValue === 'number' && numericValue < minValue) return true;
      if (maxValue !== null && typeof maxValue === 'number' && numericValue > maxValue) return true;
      return false;
  }, []);

  const getFeatureValue = (featureName: string): string | number | null => {
        const upperFeatureName = featureName.toUpperCase();
        if (realtimeIndicatorValues) {
            if (upperFeatureName === 'PH' && typeof realtimeIndicatorValues.pH === 'number' && !isNaN(realtimeIndicatorValues.pH)) return realtimeIndicatorValues.pH;
            if (upperFeatureName === 'DO' && typeof realtimeIndicatorValues.DO === 'number' && !isNaN(realtimeIndicatorValues.DO)) return realtimeIndicatorValues.DO;
            if (upperFeatureName === 'EC' && typeof realtimeIndicatorValues.EC === 'number' && !isNaN(realtimeIndicatorValues.EC)) return realtimeIndicatorValues.EC;
        }
        if (!latestDataPoint?.features) return null;
        const feature = latestDataPoint.features.find(f => f.name.toUpperCase() === upperFeatureName);
        if (!feature) return null;
        if (typeof feature.value === 'number' && !isNaN(feature.value)) return feature.value;
        if (typeof feature.textualValue === 'string' && feature.textualValue.trim() !== '') {
             const parsed = parseFloat(feature.textualValue);
             if (!isNaN(parsed)) return parsed;
        }
        if (feature.textualValue) return feature.textualValue;
        return null;
   }

  const formatFooterTime = (timeString: string | undefined | null): string => {
      if (!timeString) return 'N/A';
      try {
          const dateObject = parseISO(timeString);
           if (isNaN(dateObject.getTime())) return timeString;
          return formatDateFns(dateObject, 'HH:mm dd/MM/yyyy');
      } catch (error) { return timeString; }
  };

  const componentDataTime = realtimeIndicatorValues?.monitoring_time
                            ? formatMonitoringTime(realtimeIndicatorValues.monitoring_time)
                            : (selectedStation?.time || 'N/A');

  if (!selectedStation) {
      return <div className="text-center text-gray-500 p-4 mt-4">Chọn trạm để xem chi tiết.</div>;
  }

  return (
      <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Không hiển thị CardHeader và CardContent WQI/Recommendation riêng biệt nữa */}
          {/* <CardHeader> ... </CardHeader> */}
          {/* <CardContent> ... WQI/Recommendation cards ... </CardContent> */}

          <CardContent className="p-4"> {/* Chỉ có một CardContent cho các chỉ số */}
              { (latestDataPoint || realtimeIndicatorValues) && availableFeatures && availableFeatures.length > 0 && (
                  <>
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                          Các chỉ số thành phần (Lúc: {componentDataTime})
                          {realtimeIndicatorValues && <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300 px-1.5 py-0.5">Live</Badge>}
                      </h4>
                      <div className="grid grid-cols-3 gap-3"> {/* Luôn 3 cột */}
                          {availableFeatures.map(featureName => {
                              const value = getFeatureValue(featureName);
                              const IconComponent = getIconForFeature(featureName);
                              const unit = getDonvi(featureName);
                              const outOfRange = isValueOutOfRange(featureName, value, thresholds);
                              const isRealtime = realtimeIndicatorValues &&
                                                 ((featureName.toUpperCase() === 'PH' && realtimeIndicatorValues.pH !== undefined) ||
                                                  (featureName.toUpperCase() === 'DO' && realtimeIndicatorValues.DO !== undefined) ||
                                                  (featureName.toUpperCase() === 'EC' && realtimeIndicatorValues.EC !== undefined));

                              return (
                                  <div key={featureName} className={cn(
                                      "bg-gray-50 p-3 rounded-md border border-gray-200 flex flex-col items-center justify-center min-h-[90px] text-center",
                                      isRealtime && "ring-1 ring-green-500"
                                  )}>
                                      <div className="flex items-center text-gray-600 mb-1">
                                          <IconComponent className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                          <p className="text-xs font-semibold uppercase tracking-wide">{featureName}</p>
                                      </div>
                                      <p className={cn(
                                          "text-xl font-bold",
                                          outOfRange ? "text-red-600" : (isRealtime ? "text-green-700" : "text-gray-800")
                                      )}>
                                          {value !== null && value !== undefined ?
                                              (typeof value === 'number' ? value.toFixed(2) : value) :
                                              'N/A'
                                          }
                                          {unit && typeof value === 'number' ? <span className="text-sm font-normal ml-0.5">({unit})</span> : ''}
                                      </p>
                                  </div>
                              );
                          })}
                      </div>
                  </>
              )}
               { availableFeatures && availableFeatures.length === 0 && (latestDataPoint || realtimeIndicatorValues) && (
                   <div className="text-sm text-center text-gray-500 mt-4 pt-4">Không có dữ liệu cho các chỉ số thành phần.</div>
               )}
          </CardContent>

          <CardFooter className="bg-gray-50 border-t border-gray-200 py-2 px-4 text-xs text-gray-600 flex items-center justify-end">
               <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
               <span>Cập nhật lần cuối (API): {selectedStation?.createdAt ? formatFooterTime(selectedStation.createdAt) : 'N/A'}</span>
          </CardFooter>
      </Card>
  );
}