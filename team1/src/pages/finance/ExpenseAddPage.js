import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {createExpense, updateExpense, fetchExpense} from "../../slices/expenseSlice";
import ExpenseForm from "../../components/finance/ExpenseForm";
import "./ExpenseAddPage.css";
import AppLayout from "../../components/layout/AppLayout";

const ExpenseAddPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {id} = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const currentExpense = useSelector((state) => state.expense.currentExpense);

    // 수정 모드일 때 기존 데이터 로드
    useEffect(() => {
        if (isEditMode && id) {
            dispatch(fetchExpense(id))
                .unwrap()
                .then(() => {
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("지출 내역 조회 실패:", error);
                    alert("지출 내역을 불러올 수 없습니다.");
                    navigate("/receipt/expenses");
                });
        }
    }, [id, isEditMode, dispatch, navigate]);

    const handleSubmit = async (data) => {
        try {
            if (isEditMode) {
                // 수정 모드
                const result = await dispatch(updateExpense({id, data})).unwrap();
                return result;
            } else {
                // 등록 모드
                const result = await dispatch(createExpense(data)).unwrap();
                return result;
            }
        } catch (error) {
            console.error(isEditMode ? "지출 수정 실패:" : "지출 등록 실패:", error);
            alert(isEditMode ? "지출 수정에 실패했습니다." : "지출 등록에 실패했습니다.");
            throw error;
        }
    };

    const handleSubmitComplete = () => {
        // 영수증 업로드 완료 후 목록으로 이동
        navigate("/receipt/expenses");
    };

    const handleCancel = () => {
        navigate("/receipt/expenses");
    };

    if (loading) {
        return (
            <div className="expense-add-page">
                <div className="loading">로딩 중...</div>
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="expense-add-page">
                <div className="page-header-with-tab">
                    <div className="page-title-section">
                        <h1 className="page-title">{isEditMode ? "지출 내역 수정" : "새 지출 등록"}</h1>
                        <button className="close-tab-btn" onClick={handleCancel}>
                            ×
                        </button>
                    </div>
                    <p className="page-description">
                        {isEditMode
                            ? "지출 내역을 수정하고 영수증을 업로드할 수 있습니다."
                            : "지출 내역을 등록하고 영수증을 업로드할 수 있습니다."}
                    </p>
                </div>

                <div className="form-card">
                    <ExpenseForm
                        expense={isEditMode ? currentExpense : null}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        onSubmitComplete={handleSubmitComplete}
                    />
                </div>
            </div>
        </AppLayout>
    );
};

export default ExpenseAddPage;
