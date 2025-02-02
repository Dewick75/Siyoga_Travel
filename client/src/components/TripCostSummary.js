import React from 'react';
import { formatCurrency } from '../utils/vehicleUtils';

function TripCostSummary({ 
  tripCalculation, 
  selectedVehicle, 
  costBreakdown, 
  onProceedToBooking 
}) {
  
  if (!tripCalculation || !selectedVehicle || !costBreakdown) {
    return null;
  }

  return (
    <div style={{
      marginTop: '30px',
      padding: '25px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: '15px',
      border: '2px solid #dee2e6'
    }}>
      <h2 style={{ 
        color: '#333', 
        marginBottom: '25px',
        textAlign: 'center',
        fontSize: '24px'
      }}>
        💰 Trip Cost Summary
      </h2>

      {/* Trip Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Distance</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {costBreakdown.roundedDistance} km
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            (Original: {costBreakdown.mapDistance} km)
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Vehicle Type</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {selectedVehicle.name}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {formatCurrency(selectedVehicle.systemRate)}/km
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Trip Cost</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(costBreakdown.baseCost)}
          </div>
        </div>

        {costBreakdown.accommodationCost > 0 && (
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Accommodation</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fd7e14' }}>
              {formatCurrency(costBreakdown.accommodationCost)}
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown Details */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        marginBottom: '25px'
      }}>
        <h4 style={{ color: '#333', marginBottom: '15px' }}>📊 Cost Breakdown</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Distance Calculation:</strong>
          <div style={{ fontSize: '14px', color: '#666', marginLeft: '15px' }}>
            {costBreakdown.breakdown.distance}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Rate:</strong>
          <div style={{ fontSize: '14px', color: '#666', marginLeft: '15px' }}>
            {costBreakdown.breakdown.rate}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Trip Cost Calculation:</strong>
          <div style={{ fontSize: '14px', color: '#666', marginLeft: '15px' }}>
            {costBreakdown.breakdown.calculation}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Driver Accommodation:</strong>
          <div style={{ fontSize: '14px', color: '#666', marginLeft: '15px' }}>
            {costBreakdown.breakdown.accommodation}
          </div>
        </div>

        <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <span style={{ color: '#333' }}>Total Cost:</span>
          <span style={{ 
            color: '#28a745',
            fontSize: '24px',
            background: '#d4edda',
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            {formatCurrency(costBreakdown.totalCost)}
          </span>
        </div>
      </div>

      {/* Additional Information */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '25px'
      }}>
        <h5 style={{ color: '#856404', marginBottom: '10px' }}>📝 Important Notes:</h5>
        <ul style={{ color: '#856404', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
          <li>Price includes all taxes and fees</li>
          <li>10km additional distance added for practical purposes</li>
          <li>Distance rounded up to nearest 10km for calculation</li>
          {costBreakdown.accommodationCost > 0 && (
            <li>Accommodation cost for driver included</li>
          )}
          <li>50% advance payment required to confirm booking</li>
        </ul>
      </div>

      {/* Proceed to Booking Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onProceedToBooking}
          style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '25px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease',
            minWidth: '200px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
          }}
        >
          🚀 Proceed to Booking
        </button>
      </div>

      {/* Advance Payment Info */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>Advance Payment Required:</strong> {formatCurrency(costBreakdown.totalCost * 0.5)}
        <br />
        <span style={{ fontSize: '12px' }}>
          (50% of total cost to confirm your booking)
        </span>
      </div>
    </div>
  );
}

export default TripCostSummary;
