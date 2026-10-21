package main

import (
 "context"
 "encoding/json"
 "log"
 "net/http"
 "os"
 "time"

 "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
 ctx,cancel:=context.WithTimeout(context.Background(),15*time.Second)
 defer cancel()
 db,err:=pgxpool.New(ctx,os.Getenv("DATABASE_URL"))
 if err!=nil {log.Fatal(err)}
 defer db.Close()
 if err=db.Ping(ctx);err!=nil {log.Fatal(err)}
 mux:=http.NewServeMux()
 mux.HandleFunc("/api/v1/worker/",workerHandler(db))
 mux.HandleFunc("/api/v1/master/",masterHandler(db))
 mux.HandleFunc("/api/v1/workspace",workspaceHandler(db))
 mux.HandleFunc("/api/v1/executions",executionsHandler(db))
 mux.HandleFunc("GET /health",func(w http.ResponseWriter,r *http.Request){
  ctx,cancel:=context.WithTimeout(r.Context(),3*time.Second)
  defer cancel()
  if err:=db.Ping(ctx);err!=nil {http.Error(w,"database unavailable",http.StatusServiceUnavailable);return}
  w.Header().Set("Content-Type","application/json")
  _=json.NewEncoder(w).Encode(map[string]string{"status":"ok","database":"connected"})
 })
 mux.HandleFunc("GET /api/v1/projects",func(w http.ResponseWriter,r *http.Request){
  rows,err:=db.Query(r.Context(),"SELECT id::text,name,target FROM projects ORDER BY created_at DESC LIMIT 200")
  if err!=nil {http.Error(w,"database query failed",500);return}
  defer rows.Close()
  type project struct {ID string `json:"id"`;Name string `json:"name"`;Target string `json:"target"`}
  result:=make([]project,0)
  for rows.Next(){var p project;if err:=rows.Scan(&p.ID,&p.Name,&p.Target);err!=nil{http.Error(w,"database scan failed",500);return};result=append(result,p)}
  if rows.Err()!=nil {http.Error(w,"database iteration failed",500);return}
  w.Header().Set("Content-Type","application/json")
  _=json.NewEncoder(w).Encode(result)
 })
 addr:=os.Getenv("API_ADDR");if addr=="" {addr=":8080"}
 log.Printf("B.A.B.I API listening on %s",addr)
 log.Fatal(http.ListenAndServe(addr,mux))
}
