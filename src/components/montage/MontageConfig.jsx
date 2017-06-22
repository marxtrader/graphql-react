import React from 'react';

const MontageConfig = (props) => {

return (
        
        <form role='form'>        
        <div className='form-group'>
            <label>Select Route:</label>
            <select className='form-control'>
                <option value="">LMAX [1] via [LMAX]</option>
            </select>
        </div>

        <div className='form-group'>
            <label>Add Instrument:</label>
            <div className='input-group'>
                <select className='form-control'>

                </select>
                <span className="input-group-btn">
                    <button className="btn btn-default" type="button">+</button>
                </span>
            </div>
        </div>
        </form>
     );
};


export default MontageConfig;