from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, HnswConfigDiff,
    OptimizersConfigDiff, PayloadSchemaType,
)
from .config import COLLECTION_NAME, VECTOR_DIM, QDRANT_URL, HNSW_M, HNSW_EF_CONSTRUCT


def get_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL, timeout=30)


def init_collection(recreate: bool = False):
    client = get_client()

    if recreate and client.collection_exists(COLLECTION_NAME):
        client.delete_collection(COLLECTION_NAME)
        print(f"[Qdrant] Đã xóa collection '{COLLECTION_NAME}'")

    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_DIM,
                distance=Distance.COSINE,
                on_disk=False,
            ),
            hnsw_config=HnswConfigDiff(
                m=HNSW_M,
                ef_construct=HNSW_EF_CONSTRUCT,
                full_scan_threshold=10000,
            ),
            optimizers_config=OptimizersConfigDiff(
                indexing_threshold=0,
            ),
        )
        # Payload index để filter theo class nhanh
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="class_label",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        print(
            f"[Qdrant] Tạo collection '{COLLECTION_NAME}'\n"
            f"         dim={VECTOR_DIM}, metric=Cosine\n"
            f"         HNSW m={HNSW_M}, ef_construct={HNSW_EF_CONSTRUCT}"
        )
    else:
        print(f"[Qdrant] Collection '{COLLECTION_NAME}' đã tồn tại, bỏ qua.")


def get_collection_info() -> dict:
    client = get_client()
    info   = client.get_collection(COLLECTION_NAME)
    return {
        "points_count" : info.points_count,
        "status"       : str(info.status),
        "distance"     : str(info.config.params.vectors.distance),
        "vector_dim"   : info.config.params.vectors.size,
        "hnsw_m"       : info.config.hnsw_config.m,
        "hnsw_ef"      : info.config.hnsw_config.ef_construct,
    }


if __name__ == "__main__":
    init_collection(recreate=False)
    print(get_collection_info())