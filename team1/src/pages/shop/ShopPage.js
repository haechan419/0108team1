import React, { useEffect, useState, useRef, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import "../../styles/shop.css";
import { useCart } from "../../context/CartContext";
import CartDrawer from "../../components/common/CartDrawer"; // ✨ Drawer 컴포넌트
import FloatingUI from "../../components/common/FloatingUI"; // ✨ Floating 버튼

import { getList, API_SERVER_HOST } from "../../api/productApi";

// 사이드바 아이템 (기존 코드 유지)
const SidebarItem = ({ item, updateQuantity, removeFromCart }) => {
  const [inputValue, setInputValue] = useState(item.quantity);
  useEffect(() => {
    setInputValue(item.quantity);
  }, [item.quantity]);

  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > 2) val = val.slice(0, 2);
    setInputValue(val);
    const numVal = parseInt(val);
    if (!isNaN(numVal) && numVal >= 1) updateQuantity(item.id, numVal);
  };

  return (
      <div className="sidebar-item">
        <div style={{ flex: 1 }}>
          <div className="sidebar-item-name">{item.name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {item.price.toLocaleString()}원
          </div>
        </div>
        <div className="qty-control">
          <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              style={{ cursor: "pointer", padding: "2px 6px" }}
          >
            -
          </button>
          <input
              type="number"
              className="qty-input"
              value={inputValue}
              onChange={handleChange}
          />
          <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              style={{ cursor: "pointer", padding: "2px 6px" }}
          >
            +
          </button>
          <button
              onClick={() => removeFromCart(item.id)}
              style={{
                color: "red",
                border: "none",
                background: "none",
                cursor: "pointer",
                marginLeft: "2px",
              }}
          >
            x
          </button>
        </div>
      </div>
  );
};

export default function ShopPage() {
  const {
    addToCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    totalPrice,
    favorites,
    toggleFavorite,
    currentCategory,
    setCurrentCategory,
    openDrawer, // ✨ [핵심] Context에서 서랍 열기 함수 가져오기!
  } = useCart();

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  // 데이터 불러오기 (기존 유지)
  const fetchData = useCallback(async (pageNum, category, isReset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const reqCategory = category === "Favorites" ? "All" : category;
      const data = await getList({
        page: pageNum,
        size: 12,
        category: reqCategory,
      });
      if (isReset) setProducts(data.content);
      else
        setProducts((prev) => {
          const newItems = data.content.filter(
              (n) => !prev.some((p) => p.pno === n.pno)
          );
          return [...prev, ...newItems];
        });
      setHasNext(data.current < data.totalPage);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasNext(true);
    setLoading(false);
    fetchData(1, currentCategory, true);
  }, [currentCategory]);

  useEffect(() => {
    if (!hasNext) return;
    const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loading) {
            setPage((prev) => prev + 1);
            fetchData(page + 1, currentCategory, false);
          }
        },
        { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNext, loading, page, currentCategory, fetchData]);

  const handleAddToCart = (product) => {
    if (product.stockQuantity <= 0) {
      alert("품절된 상품입니다.");
      return;
    }
    const imageUrl = product.uploadFileNames?.[0]
        ? `${API_SERVER_HOST}/api/products/view/s_${product.uploadFileNames[0]}`
        : "https://via.placeholder.com/150";
    addToCart({
      id: product.pno,
      name: product.pname,
      price: product.price,
      img: imageUrl,
      category: product.category,
      quantity: 1,
    });
  };

  // ✨ [수정됨] 결제 요청 핸들러
  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("장바구니가 비어있습니다!");

    // 페이지 이동 대신 "서랍 열기" 실행!
    openDrawer();
  };

  const displayedProducts =
      currentCategory === "Favorites"
          ? products.filter((p) => favorites.includes(p.pno))
          : products;

  return (
      <AppLayout>
        {/* ✨ CartDrawer와 FloatingUI가 Context의 isDrawerOpen을 공유함 */}
        <CartDrawer />
        <FloatingUI />

        <div className="page-header">
          <h2 className="page-title">📦 비품 구매</h2>
          <p className="text-gray">원하는 비품을 카테고리별로 확인하세요.</p>
        </div>

        <div className="shop-container">
          <div className="shop-main">
            {/* 카테고리 필터 */}
            <div className="shop-header">
              <div className="shop-filter">
                {[
                  "All",
                  "Favorites",
                  "사무용품",
                  "전자기기",
                  "가구",
                  "탕비실",
                ].map((cat) => (
                    <button
                        key={cat}
                        className={`filter-btn ${
                            currentCategory === cat ? "active" : ""
                        }`}
                        onClick={() => setCurrentCategory(cat)}
                        style={
                          cat === "Favorites"
                              ? { color: "#f1c40f", borderColor: "#f1c40f" }
                              : {}
                        }
                    >
                      {cat === "Favorites" ? "★ 즐겨찾기" : cat}
                    </button>
                ))}
              </div>
            </div>

            {/* 상품 리스트 */}
            <div className="product-grid">
              {displayedProducts.map((product) => {
                const isFav = favorites.includes(product.pno);
                const imageUrl = product.uploadFileNames?.[0]
                    ? `${API_SERVER_HOST}/api/products/view/s_${product.uploadFileNames[0]}`
                    : "https://via.placeholder.com/150";
                return (
                    <div
                        key={product.pno}
                        className="product-card"
                        style={{ position: "relative" }}
                    >
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.pno);
                          }}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "white",
                            border: "1px solid #ddd",
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            cursor: "pointer",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isFav ? "#f1c40f" : "#ddd",
                            zIndex: 5,
                          }}
                      >
                        ★
                      </button>
                      <div style={{ position: "relative" }}>
                        <img
                            src={imageUrl}
                            alt={product.pname}
                            className="card-img"
                        />
                        {product.stockQuantity <= 0 && (
                            <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                }}
                            >
                              품절
                            </div>
                        )}
                      </div>
                      <div className="card-body">
                        <span className="card-category">{product.category}</span>
                        <div className="card-title">{product.pname}</div>
                        <div className="card-price">
                          {product.price.toLocaleString()}원
                        </div>
                        <div
                            style={{
                              fontSize: "12px",
                              color:
                                  product.stockQuantity < 10 ? "#e74c3c" : "#2ecc71",
                              marginBottom: "10px",
                              fontWeight: "bold",
                            }}
                        >
                          재고: {product.stockQuantity}개
                        </div>
                        <div className="card-footer">
                          <button
                              className="add-cart-btn"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stockQuantity <= 0}
                              style={{
                                backgroundColor:
                                    product.stockQuantity > 0 ? "#2c3e50" : "#bdc3c7",
                                cursor:
                                    product.stockQuantity > 0
                                        ? "pointer"
                                        : "not-allowed",
                              }}
                          >
                            {product.stockQuantity > 0 ? "담기" : "품절"}
                          </button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
            <div
                ref={observerTarget}
                style={{
                  height: "60px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "20px",
                }}
            >
              {loading && (
                  <div style={{ color: "#999", fontWeight: "bold" }}>
                    ⏳ 로딩 중...
                  </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <aside className="shop-sidebar">
            <div className="sidebar-title">
              장바구니 현황 ({cartItems.length})
            </div>
            <div className="sidebar-list">
              {cartItems.length === 0 ? (
                  <div
                      style={{
                        color: "#999",
                        textAlign: "center",
                        marginTop: "50px",
                      }}
                  >
                    텅 비었습니다.
                    <br />
                    왼쪽에서 담아보세요!
                  </div>
              ) : (
                  cartItems.map((item) => (
                      <SidebarItem
                          key={item.id}
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromCart={removeFromCart}
                      />
                  ))
              )}
            </div>
            <div className="sidebar-footer">
              <div className="sidebar-total">
                <span>합계</span>
                <span>{totalPrice.toLocaleString()}원</span>
              </div>

              {/* ✨ 여기가 핵심! 이 버튼 누르면 -> openDrawer() 실행 -> Drawer 열림 */}
              <button className="sidebar-checkout-btn" onClick={handleCheckout}>
                결제 요청하기
              </button>
            </div>
          </aside>
        </div>
      </AppLayout>
  );
}
