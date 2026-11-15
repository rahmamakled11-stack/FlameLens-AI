<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ListExperimentsRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const ALLOWED_QUERY_PARAMETERS = [
        'q',
        'program',
        'mission',
        'page',
        'per_page',
        'sort',
        'direction',
    ];

    protected function prepareForValidation(): void
    {
        foreach (['q', 'program', 'mission'] as $parameter) {
            $value = $this->query($parameter);

            if (is_string($value)) {
                $normalized = trim($value);
                $this->query->set($parameter, $normalized === '' ? null : $normalized);
            }
        }
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'min:1', 'max:200'],
            'program' => ['sometimes', 'nullable', 'string', 'max:255'],
            'mission' => ['sometimes', 'nullable', 'string', 'max:255'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'in:title'],
            'direction' => ['sometimes', 'in:asc,desc'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach (array_keys($this->query->all()) as $parameter) {
                if (! in_array($parameter, self::ALLOWED_QUERY_PARAMETERS, true)) {
                    $validator->errors()->add($parameter, 'This query parameter is not supported.');
                }
            }
        });
    }
}
