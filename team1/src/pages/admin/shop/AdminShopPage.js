import React, { useEffect, useState, useRef, useCallback } from "react";
import AppLayout from "../../../components/layout/AppLayout";
import {
  getList,
  postAdd,
  putOne,
  deleteOne,
  putOrder,
  API_SERVER_HOST,
} from "../../../api/productApi";

const productInitState = {
  pname: "",
  price: 0,
  pdesc: "",
  category: "사무용품",
  stockQuantity: 100,
  files: [],
};

const CATEGORIES = ["All", "사무용품", "전자기기", "탕비실", "가구"];

const AdminShopPage = () => {
  // 전체 데이터 (드래그 정렬을 위해 한 번에 로드)
  const [allProducts, setAllProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("All");

  // ✨ 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // 한 페이지당 12개씩 보기

  // 모달 및 편집 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ ...productInitState });
  const [mode, setMode] = useState("ADD");

  // 드래그 & 선택 상태
  const dragItem = useRef();
  const dragOverItem = useRef();
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const uploadRef = useRef();

  // 1. 데이터 불러오기 (한 번에 100개 로드 -> 클라이언트에서 자름)
  const fetchData = useCallback((category) => {
    getList({ page: 1, size: 100, category: category })
      .then((data) => {
        setAllProducts(data.content);
        setIsOrderChanged(false);
        setSelectedIds([]);
        setCurrentPage(1); // 카테고리 변경 시 1페이지로
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchData(currentCategory);
  }, [currentCategory, fetchData]);

  // ✨ 현재 페이지에 보여줄 데이터 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // --- 드래그 앤 드롭 로직 ---
  const dragStart = (e, index) => {
    // 전체 리스트 기준 인덱스로 변환
    const globalIndex = indexOfFirstItem + index;
    dragItem.current = globalIndex;
    e.target.style.opacity = "0.4";
  };
  const dragEnter = (e, index) => {
    const globalIndex = indexOfFirstItem + index;
    dragOverItem.current = globalIndex;
  };
  const dragEnd = (e) => {
    e.target.style.opacity = "1";

    // 전체 리스트 복사 후 재배열
    const copyList = [...allProducts];
    const dragItemContent = copyList[dragItem.current];
    copyList.splice(dragItem.current, 1);
    copyList.splice(dragOverItem.current, 0, dragItemContent);

    dragItem.current = null;
    dragOverItem.current = null;
    setAllProducts(copyList);
    setIsOrderChanged(true);
  };

  // 순서 DB 저장
  const handleApplyOrder = () => {
    if (!isOrderChanged) return;
    const pnoList = allProducts.map((p) => p.pno); // 전체 리스트의 순서 저장

    putOrder(pnoList)
      .then(() => {
        alert("✅ 순서가 저장되었습니다!");
        setIsOrderChanged(false);
        fetchData(currentCategory);
      })
      .catch(() => alert("순서 저장 실패"));
  };

  // --- CRUD 핸들러 ---
  const handleChange = (e) =>
    setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });

  const handleSave = () => {
    const formData = new FormData();
    formData.append("pname", currentProduct.pname);
    formData.append("pdesc", currentProduct.pdesc);
    formData.append("price", currentProduct.price);
    formData.append("category", currentProduct.category);
    formData.append("stockQuantity", currentProduct.stockQuantity);
    if (uploadRef.current?.files.length > 0) {
      for (let i = 0; i < uploadRef.current.files.length; i++)
        formData.append("files", uploadRef.current.files[i]);
    }

    const apiCall =
      mode === "ADD" ? postAdd(formData) : putOne(currentProduct.pno, formData);
    apiCall.then(() => {
      alert("저장 완료");
      setIsModalOpen(false);
      fetchData(currentCategory);
    });
  };

  const handleDelete = (pno) => {
    if (window.confirm("삭제하시겠습니까?")) {
      deleteOne(pno).then(() => {
        fetchData(currentCategory);
      });
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setMode("EDIT");
      setCurrentProduct(product);
    } else {
      setMode("ADD");
      setCurrentProduct({ ...productInitState });
    }
    setIsModalOpen(true);
  };

  const toggleSelect = (pno) => {
    if (selectedIds.includes(pno))
      setSelectedIds(selectedIds.filter((id) => id !== pno));
    else setSelectedIds([...selectedIds, pno]);
  };

  const handleBatchDelete = () => {
    if (window.confirm(`${selectedIds.length}개 삭제?`)) {
      Promise.all(selectedIds.map((pno) => deleteOne(pno))).then(() => {
        alert("삭제 완료");
        fetchData(currentCategory);
      });
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: "30px", maxWidth: "1600px", margin: "0 auto" }}>
        {/* 상단 헤더 */}
        <div style={headerContainerStyle}>
          <div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "800",
                margin: 0,
                color: "#2c3e50",
              }}
            >
              🎨 상품 진열 관리
            </h2>
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCurrentCategory(cat)}
                  style={{
                    ...tabStyle,
                    backgroundColor: currentCategory === cat ? "#333" : "#eee",
                    color: currentCategory === cat ? "white" : "#333",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <button
              onClick={handleApplyOrder}
              disabled={!isOrderChanged}
              style={
                isOrderChanged ? btnStyle.applyActive : btnStyle.applyDisabled
              }
            >
              {isOrderChanged ? "💾 순서 DB 저장" : "순서 변경 없음"}
            </button>
            <button onClick={() => openModal(null)} style={btnStyle.add}>
              + 상품 등록
            </button>
          </div>
        </div>

        {/* ✨ 상품 그리드 (현재 페이지 아이템만 렌더링) */}
        <div style={gridContainerStyle}>
          {currentItems.map((product, index) => (
            <div
              key={product.pno}
              draggable
              onDragStart={(e) => dragStart(e, index)} // 현재 페이지 내 인덱스 전달
              onDragEnter={(e) => dragEnter(e, index)}
              onDragEnd={dragEnd}
              onDragOver={(e) => e.preventDefault()}
              style={{
                ...cardStyle,
                border: selectedIds.includes(product.pno)
                  ? "2px solid #3498db"
                  : "1px solid #eee",
                backgroundColor: selectedIds.includes(product.pno)
                  ? "#fbfdff"
                  : "white",
              }}
            >

              <div style={imageContainerStyle}>
                {product.uploadFileNames.length > 0 ? (
                  <img
                    src={`${API_SERVER_HOST}/api/products/view/s_${product.uploadFileNames[0]}`}
                    alt={product.pname}
                    style={imageStyle}
                  />
                ) : (
                  <div style={noImageStyle}>No Image</div>
                )}
              </div>

              <div style={infoContainerStyle}>
                <div style={categoryBadgeStyle}>{product.category}</div>
                <div style={productNameStyle}>{product.pname}</div>
                <div style={priceRowStyle}>
                  <span style={priceStyle}>
                    {product.price.toLocaleString()}원
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: product.stockQuantity < 10 ? "#e74c3c" : "#2ecc71",
                    }}
                  >
                    재고 {product.stockQuantity}
                  </span>
                </div>
              </div>

              <div style={actionBarContainerStyle}>
                <button
                  onClick={() => openModal(product)}
                  style={actionBtnStyle.edit}
                >
                  ✏️ 수정
                </button>
                <div
                  style={{ width: "1px", height: "20px", background: "#eee" }}
                ></div>
                <button
                  onClick={() => handleDelete(product.pno)}
                  style={actionBtnStyle.delete}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))}

          {allProducts.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "50px",
                color: "#aaa",
              }}
            >
              등록된 상품이 없습니다.
            </div>
          )}
        </div>

        {/* ✨ 페이지네이션 컨트롤 (숫자 버튼) */}
        {totalPages > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "40px",
              gap: "5px",
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "50%", // 원형 버튼
                    cursor: "pointer",
                    backgroundColor:
                      currentPage === pageNum ? "#2c3e50" : "white",
                    color: currentPage === pageNum ? "white" : "#333",
                    fontWeight: "bold",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    transition: "all 0.2s",
                  }}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>
        )}

        {/* 모달 (기존 유지) */}
        {isModalOpen && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3>{mode === "ADD" ? "상품 등록" : "상품 수정"}</h3>
              <div style={inputGroupStyle}>
                <label>카테고리</label>
                <select
                  name="category"
                  value={currentProduct.category}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={inputGroupStyle}>
                <label>상품명</label>
                <input
                  name="pname"
                  value={currentProduct.pname}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label>가격</label>
                  <input
                    type="number"
                    name="price"
                    value={currentProduct.price}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>재고</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={currentProduct.stockQuantity}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={inputGroupStyle}>
                <label>설명</label>
                <textarea
                  name="pdesc"
                  value={currentProduct.pdesc}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div style={inputGroupStyle}>
                <label>이미지</label>
                <input type="file" ref={uploadRef} multiple />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={btnStyle.cancel}
                >
                  취소
                </button>
                <button onClick={handleSave} style={btnStyle.save}>
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// 스타일 (동일 유지)
const headerContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "30px",
  alignItems: "flex-end",
  paddingBottom: "20px",
  borderBottom: "1px solid #eee",
};
const tabStyle = {
  padding: "8px 16px",
  borderRadius: "20px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};
const gridContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "25px",
};
const cardStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  overflow: "hidden",
  cursor: "grab",
  transition: "transform 0.2s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};
const cardHeaderStyle = {
  position: "absolute",
  top: "10px",
  left: "10px",
  zIndex: 10,
};
const imageContainerStyle = {
  width: "100%",
  height: "180px",
  backgroundColor: "#f8f9fa",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };
const noImageStyle = { color: "#ccc" };
const infoContainerStyle = { padding: "15px", flex: 1 };
const categoryBadgeStyle = {
  fontSize: "11px",
  color: "#888",
  textTransform: "uppercase",
};
const productNameStyle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "5px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const priceRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "10px",
};
const priceStyle = { fontSize: "18px", fontWeight: "800", color: "#2c3e50" };
const actionBarContainerStyle = {
  display: "flex",
  borderTop: "1px solid #f0f0f0",
  backgroundColor: "#fff",
};
const actionBtnStyle = {
  edit: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#555",
  },
  delete: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#e74c3c",
  },
};
const btnStyle = {
  add: {
    padding: "10px 20px",
    background: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  applyActive: {
    padding: "10px 20px",
    background: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  applyDisabled: {
    padding: "10px 20px",
    background: "#ecf0f1",
    color: "#bdc3c7",
    border: "none",
    borderRadius: "8px",
    cursor: "default",
  },
  deleteBatch: {
    padding: "10px 20px",
    background: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  save: {
    padding: "10px 20px",
    background: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
  cancel: {
    padding: "10px 20px",
    background: "#eee",
    border: "none",
    borderRadius: "5px",
  },
};
const inputGroupStyle = { marginBottom: "15px" };
const inputStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "5px",
};
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1200,
};
const modalContentStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "450px",
};

export default AdminShopPage;
