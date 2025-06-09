package action

import (
	"net/http"
	"signaling/src/comerrors"
	"signaling/src/framework"
)

type comHttpResp struct {
	ErrNo  int         `json:"errNo`
	ErrMsg string      `json:"errMsg`
	Data   interface{} `json:"data`
}

func writeJsonErrorResponse(cerr *comerrors.Errors, w http.ResponseWriter,
	cr *framework.ComRequest) {

}
