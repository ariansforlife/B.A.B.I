package main

import (
 "encoding/json"
 "net/http"
 "github.com/jackc/pgx/v5/pgxpool"
)
func workerHandler(db *pgxpool.Pool)http.HandlerFunc{
 return func(w http.ResponseWriter,r *http.Request){
  w.Header().Set("Content-Type","application/json")
  if r.Method==http.MethodPost&&r.URL.Path=="/api/v1/worker/claim"{
   tx,err:=db.Begin(r.Context());if err!=nil{http.Error(w,"db error",500);return};defer tx.Rollback(r.Context())
   var id,engine,device string;var snapshot []byte
   err=tx.QueryRow(r.Context(),`SELECT id::text,engine,COALESCE(device_id,''),snapshot FROM execution_jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`).Scan(&id,&engine,&device,&snapshot)
   if err!=nil{w.WriteHeader(http.StatusNoContent);return}
   if _,err=tx.Exec(r.Context(),`UPDATE execution_jobs SET status='running',started_at=now() WHERE id=$1::uuid`,id);err!=nil{http.Error(w,"claim failed",500);return}
   if tx.Commit(r.Context())!=nil{http.Error(w,"commit failed",500);return}
   _=json.NewEncoder(w).Encode(map[string]any{"id":id,"engine":engine,"deviceId":device,"snapshot":json.RawMessage(snapshot)});return
  }
  if r.Method==http.MethodPost&&r.URL.Path=="/api/v1/worker/complete"{
   r.Body=http.MaxBytesReader(w,r.Body,2<<20)
   var v struct{ID string `json:"id"`;Results []struct{TestCaseID string `json:"testCaseId"`;Status string `json:"status"`;DurationMs int64 `json:"durationMs"`;Logs json.RawMessage `json:"logs"`;Artifacts json.RawMessage `json:"artifacts"`} `json:"results"`}
   if json.NewDecoder(r.Body).Decode(&v)!=nil||v.ID==""||len(v.Results)==0{http.Error(w,"invalid results",400);return}
   tx,err:=db.Begin(r.Context());if err!=nil{http.Error(w,"db error",500);return};defer tx.Rollback(r.Context())
   var status string
   if err=tx.QueryRow(r.Context(),`SELECT status FROM execution_jobs WHERE id=$1::uuid FOR UPDATE`,v.ID).Scan(&status);err!=nil||status!="running"{http.Error(w,"job not running",409);return}
   failed:=false
   for _,v:=range v.Results{
    if v.TestCaseID==""||!contains([]string{"passed","failed","skipped"},v.Status)||v.DurationMs<0||!json.Valid(v.Logs)||!json.Valid(v.Artifacts){http.Error(w,"invalid result",400);return}
    if v.Status=="failed"{failed=true}
    if _,err=tx.Exec(r.Context(),`INSERT INTO execution_job_results(execution_id,test_case_id,status,duration_ms,logs,artifacts) VALUES($1::uuid,$2,$3,$4,$5,$6) ON CONFLICT(execution_id,test_case_id) DO UPDATE SET status=EXCLUDED.status,duration_ms=EXCLUDED.duration_ms,logs=EXCLUDED.logs,artifacts=EXCLUDED.artifacts`,v.ID,v.TestCaseID,v.Status,v.DurationMs,v.Logs,v.Artifacts);err!=nil{http.Error(w,"result write failed",500);return}
   }
   state:="completed";if failed{state="failed"}
   if _,err=tx.Exec(r.Context(),`UPDATE execution_jobs SET status=$2,finished_at=now() WHERE id=$1::uuid`,v.ID,state);err!=nil{http.Error(w,"finish failed",500);return}
   if tx.Commit(r.Context())!=nil{http.Error(w,"commit failed",500);return}
   _=json.NewEncoder(w).Encode(map[string]string{"status":state});return
  }
  http.Error(w,"method not allowed",405)
 }
}
