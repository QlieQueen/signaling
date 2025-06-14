package xrpc

const (
	HEADER_SIZE     = 36
	HEADER_MAGICHUM = 0x2202202
)

type Header struct {
	Id       uint16
	Version  uint16
	LogId    uint32
	Provider [16]byte
	MagicNum uint32
	Reserved uint32
	BodyLen  uint32
}
