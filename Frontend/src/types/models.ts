export interface ModelAI {
    id: string;       
    created_at: string;        
    updated_at: string;     
    deleted_at: string | null; 
    name: string;     
    version: string;          
    file_path: string;         
    description: string;     
    trained_at: string;       
    station_id: string;         
    availability: boolean;        
    parameter_list: string[];    
  }

export interface BestRecommend {
  parameter_name: string;
  best_model: string;
  best_metric_value: number;
  metric_name: string;
  metric_description: string;
  all_metrics: ModelMetric[];
  recommendation: string;
}

export interface ModelMetric {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  model_id: string;
  model_name: string;
  parameter_name: string;
  station_id: string;
  mse: number;
  rmse: number;
  mae: number;
  r2: number;
  hrse: number | null;
}