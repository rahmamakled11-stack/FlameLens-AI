<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class NoQueryParametersRequest extends FormRequest
{
    public function rules(): array
    {
        return [];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach (array_keys($this->query->all()) as $parameter) {
                $validator->errors()->add($parameter, 'This query parameter is not supported.');
            }
        });
    }
}
