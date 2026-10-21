package main

import (
 "encoding/json"
 "errors"
 "io"
 "net/http"
 "github.com/jackc/pgx/v5"
 "github.com/jackc/pgx/v5/pgxpool"
)

type workspaceRecord struct {
 Document json.RawMessage `json:"document"`
 Revision int64 `json:"revision"`
}
func workspaceHandler(db *pgxpool.Pool) http.HandlerFunc {
 return func(w http.ResponseWriter,r *http.Request) {
  w.Header().Set("Content-Type","application/json")
  switch r.Method {
  case http.MethodGet:
   var doc []byte
   var rev int64
   err:=db.QueryRow(r.Context(),"SELECT document,revision FROM workspace_snapshots WHERE id=1").Scan(&doc,&rev)
   if errors.Is(err,pgx.ErrNoRows) { _=json.NewEncoder(w).Encode(workspaceRecord{Document:json.RawMessage(`{"schemaVersion":1,"projects":[]}`),Revision:0});return }
   if err!=nil {http.Error(w,"database read failed",500);return}
   _=json.NewEncoder(w).Encode(workspaceRecord{Document:doc,Revision:rev})
  case http.MethodPut:
   r.Body=http.MaxBytesReader(w,r.Body,5<<20)
   var request workspaceRecord
   if err:=json.NewDecoder(r.Body).Decode(&request);err!=nil {http.Error(w,"invalid request",400);return}
   if !json.Valid(request.Document) {http.Error(w,"invalid document",400);return}
   var root struct {SchemaVersion int `json:"schemaVersion"`;Projects []json.RawMessage `json:"projects"`}
   if err:=json.Unmarshal(request.Document,&root);err!=nil||root.SchemaVersion!=1||root.Projects==nil {http.Error(w,"invalid workspace schema",400);return}
   var rev int64
   err:=db.QueryRow(r.Context(),`INSERT INTO workspace_snapshots(id,document,revision) SELECT 1,$1,1 WHERE $2=0 ON CONFLICT(id) DO NOTHING RETURNING revision`,request.Document,request.Revision).Scan(&rev)
   if errors.Is(err,pgx.ErrNoRows) {
    err=db.QueryRow(r.Context(),`UPDATE workspace_snapshots SET document=$1,revision=revision+1,updated_at=now() WHERE id=1 AND revision=$2 RETURNING revision`,request.Document,request.Revision).Scan(&rev)
   }
   if errors.Is(err,pgx.ErrNoRows) {http.Error(w,"workspace revision conflict",409);return}
   if err!=nil {http.Error(w,"database write failed",500);return}
   _=json.NewEncoder(w).Encode(map[string]int64{"revision":rev})
  default:
   w.Header().Set("Allow","GET, PUT")
   http.Error(w,"method not allowed",http.StatusMethodNotAllowed)
  }
 }
}
var _ = io.EOF
