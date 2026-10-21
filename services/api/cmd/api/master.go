package main

import (
 "encoding/json"
 "net/http"
 "strings"
 "github.com/jackc/pgx/v5/pgxpool"
)

type masterRecord struct {ID string `json:"id"`;ProjectID string `json:"projectId"`;Name string `json:"name"`;Data json.RawMessage `json:"data"`}
var masterKinds=map[string]bool{"features":true,"scenarios":true,"test-cases":true,"test-suites":true,"scripts":true,"bindings":true,"environments":true,"devices":true,"runners":true}
func masterHandler(db *pgxpool.Pool)http.HandlerFunc {
 return func(w http.ResponseWriter,r *http.Request){
  w.Header().Set("Content-Type","application/json")
  kind:=strings.TrimPrefix(r.URL.Path,"/api/v1/master/")
  if !masterKinds[kind] {http.Error(w,"unknown master type",404);return}
  if r.Method==http.MethodGet {
   project:=r.URL.Query().Get("projectId")
   rows,err:=db.Query(r.Context(),`SELECT id,project_id,name,data FROM master_records WHERE kind=$1 AND ($2='' OR project_id=$2) ORDER BY name LIMIT 500`,kind,project)
   if err!=nil{http.Error(w,"database read failed",500);return};defer rows.Close()
   out:=make([]masterRecord,0)
   for rows.Next(){var v masterRecord;if rows.Scan(&v.ID,&v.ProjectID,&v.Name,&v.Data)!=nil{http.Error(w,"scan failed",500);return};out=append(out,v)}
   if rows.Err()!=nil{http.Error(w,"read failed",500);return}
   _=json.NewEncoder(w).Encode(out);return
  }
  if r.Method==http.MethodPut{
   r.Body=http.MaxBytesReader(w,r.Body,2<<20)
   var v masterRecord
   if json.NewDecoder(r.Body).Decode(&v)!=nil||v.ID==""||v.Name==""||!json.Valid(v.Data)||len(v.ID)>128||len(v.ProjectID)>128{http.Error(w,"invalid master record",400);return}
   _,err:=db.Exec(r.Context(),`INSERT INTO master_records(kind,id,project_id,name,data) VALUES($1,$2,$3,$4,$5) ON CONFLICT(kind,id) DO UPDATE SET project_id=EXCLUDED.project_id,name=EXCLUDED.name,data=EXCLUDED.data,updated_at=now()`,kind,v.ID,v.ProjectID,v.Name,v.Data)
   if err!=nil{http.Error(w,"database write failed",500);return}
   _=json.NewEncoder(w).Encode(map[string]string{"id":v.ID,"status":"saved"});return
  }
  if r.Method==http.MethodDelete{
   id:=r.URL.Query().Get("id")
   if id==""{http.Error(w,"id required",400);return}
   tag,err:=db.Exec(r.Context(),`DELETE FROM master_records WHERE kind=$1 AND id=$2`,kind,id)
   if err!=nil{http.Error(w,"database delete failed",500);return}
   if tag.RowsAffected()==0{http.Error(w,"not found",404);return}
   w.WriteHeader(http.StatusNoContent);return
  }
  w.Header().Set("Allow","GET, PUT, DELETE");http.Error(w,"method not allowed",405)
 }
}
